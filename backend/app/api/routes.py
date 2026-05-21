from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.config import get_settings
from app.models import AnnotationRange, Video, Voice, VocabularyEntry
from app.schemas.common import MessageResponse
from app.schemas.range import RangeCreate, RangeResponse, RangeUpdate
from app.schemas.stats import VoiceStatsResponse
from app.schemas.video import VideoResolveRequest, VideoResolveResponse, VideoResponse, VideoSummaryResponse
from app.schemas.vocabulary import VocabularyEntryCreate, VocabularyEntryResponse, VocabularyEntryUpdate
from app.schemas.voice import VoiceCreate, VoiceResponse, VoiceUpdate
from app.services.pagination import paginate
from app.services.youtube import extract_youtube_video_id


router = APIRouter()
settings = get_settings()


def _ensure_vocab(db: Session, vocab_id: str, vocab_type: str, active_only: bool = True) -> VocabularyEntry:
    statement = select(VocabularyEntry).where(
        VocabularyEntry.id == vocab_id,
        VocabularyEntry.type == vocab_type,
    )
    if active_only:
        statement = statement.where(VocabularyEntry.is_active.is_(True))
    vocab = db.scalar(statement)
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_VOCABULARY_VALUE", "message": f"Invalid {vocab_type} value."},
        )
    return vocab


def _get_voice_or_404(db: Session, voice_id: str) -> Voice:
    voice = db.scalar(select(Voice).where(Voice.id == voice_id).options(joinedload(Voice.gender)))
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    return voice


def _get_video_or_404(db: Session, video_id: str) -> Video:
    video = db.scalar(select(Video).where(Video.id == video_id))
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


def _get_range_or_404(db: Session, range_id: str) -> AnnotationRange:
    item = db.scalar(
        select(AnnotationRange)
        .where(AnnotationRange.id == range_id, AnnotationRange.deleted_at.is_(None))
        .options(
            joinedload(AnnotationRange.voice).joinedload(Voice.gender),
            joinedload(AnnotationRange.video),
            joinedload(AnnotationRange.emotion),
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Range not found")
    return item


def _range_to_response(item: AnnotationRange) -> RangeResponse:
    return RangeResponse(
        id=item.id,
        created_at=item.created_at,
        updated_at=item.updated_at,
        video_id=item.video_id,
        voice_id=item.voice_id,
        voice_name=item.voice.name,
        start_ms=item.start_ms,
        end_ms=item.end_ms,
        duration_ms=item.end_ms - item.start_ms,
        transcription=item.transcription,
        emotion_vocab_id=item.emotion_vocab_id,
        emotion_label=item.emotion.value if item.emotion else None,
        note=item.note,
        source_url=item.video.source_url,
        youtube_video_id=item.video.youtube_video_id,
    )


def _voice_summary_statement(include_archived: bool = True):
    duration_expr = AnnotationRange.end_ms - AnnotationRange.start_ms
    statement = (
        select(
            Voice,
            VocabularyEntry.value.label("gender_label"),
            func.count(AnnotationRange.id).label("range_count"),
            func.coalesce(func.sum(duration_expr), 0).label("total_duration_ms"),
        )
        .join(VocabularyEntry, Voice.gender_vocab_id == VocabularyEntry.id)
        .outerjoin(
            AnnotationRange,
            (AnnotationRange.voice_id == Voice.id) & (AnnotationRange.deleted_at.is_(None)),
        )
        .group_by(Voice.id, VocabularyEntry.value)
        .order_by(Voice.created_at.desc())
    )
    if not include_archived:
        statement = statement.where(Voice.archived_at.is_(None))
    return statement


def _video_summary_statement():
    duration_expr = AnnotationRange.end_ms - AnnotationRange.start_ms
    return (
        select(
            Video,
            func.count(AnnotationRange.id).label("range_count"),
            func.coalesce(func.sum(duration_expr), 0).label("total_duration_ms"),
        )
        .outerjoin(
            AnnotationRange,
            (AnnotationRange.video_id == Video.id) & (AnnotationRange.deleted_at.is_(None)),
        )
        .group_by(Video.id)
        .order_by(Video.created_at.desc())
    )


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/config")
def config():
    return {
        "timestampFormat": "HH:MM:SS.mmm",
        "defaultPageSize": settings.default_page_size,
        "maxPageSize": settings.max_page_size,
        "vocabularyTypes": ["gender", "emotion"],
    }


@router.post("/videos/resolve", response_model=VideoResolveResponse)
def resolve_video(payload: VideoResolveRequest, db: Session = Depends(get_db)):
    video_id = extract_youtube_video_id(payload.youtube_url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_YOUTUBE_URL", "message": "The provided URL is not a supported YouTube link."},
        )

    existing = db.scalar(select(Video).where(Video.youtube_video_id == video_id))
    if existing:
        return VideoResolveResponse(id=existing.id, youtube_video_id=existing.youtube_video_id, youtube_url=existing.source_url)

    video = Video(youtube_video_id=video_id, source_url=payload.youtube_url)
    db.add(video)
    db.commit()
    db.refresh(video)
    return VideoResolveResponse(id=video.id, youtube_video_id=video.youtube_video_id, youtube_url=video.source_url)


@router.get("/videos", response_model=dict)
def list_videos(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    statement = _video_summary_statement()
    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            Video.youtube_video_id.ilike(pattern) | Video.source_url.ilike(pattern) | Video.title.ilike(pattern)
        )
    result = paginate(db, statement, page, page_size)
    result["items"] = [
        VideoSummaryResponse(
            id=video.id,
            created_at=video.created_at,
            updated_at=video.updated_at,
            youtube_video_id=video.youtube_video_id,
            source_url=video.source_url,
            title=video.title,
            range_count=int(range_count or 0),
            total_duration_ms=int(total_duration_ms or 0),
        ).model_dump(by_alias=True)
        for video, range_count, total_duration_ms in result["items"]
    ]
    return result


@router.get("/voices/{voice_id}/videos", response_model=dict)
def get_voice_videos(
    voice_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    db: Session = Depends(get_db),
):
    _get_voice_or_404(db, voice_id)
    duration_expr = AnnotationRange.end_ms - AnnotationRange.start_ms
    statement = (
        select(
            Video,
            func.count(AnnotationRange.id).label("range_count"),
            func.coalesce(func.sum(duration_expr), 0).label("total_duration_ms"),
        )
        .join(
            AnnotationRange,
            (AnnotationRange.video_id == Video.id)
            & (AnnotationRange.voice_id == voice_id)
            & (AnnotationRange.deleted_at.is_(None)),
        )
        .group_by(Video.id)
        .order_by(func.max(AnnotationRange.created_at).desc())
    )
    result = paginate(db, statement, page, page_size)
    result["items"] = [
        VideoSummaryResponse(
            id=video.id,
            created_at=video.created_at,
            updated_at=video.updated_at,
            youtube_video_id=video.youtube_video_id,
            source_url=video.source_url,
            title=video.title,
            range_count=int(range_count or 0),
            total_duration_ms=int(total_duration_ms or 0),
        ).model_dump(by_alias=True)
        for video, range_count, total_duration_ms in result["items"]
    ]
    return result


@router.get("/videos/{video_id}", response_model=VideoResponse)
def get_video(video_id: str, db: Session = Depends(get_db)):
    return _get_video_or_404(db, video_id)


@router.get("/videos/{video_id}/ranges", response_model=dict)
def list_video_ranges(
    video_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    db: Session = Depends(get_db),
):
    _get_video_or_404(db, video_id)
    statement = (
        select(AnnotationRange)
        .where(AnnotationRange.video_id == video_id, AnnotationRange.deleted_at.is_(None))
        .options(
            joinedload(AnnotationRange.voice),
            joinedload(AnnotationRange.video),
            joinedload(AnnotationRange.emotion),
        )
        .order_by(AnnotationRange.start_ms.asc())
    )
    result = paginate(db, statement, page, page_size)
    result["items"] = [_range_to_response(item[0]).model_dump(by_alias=True) for item in result["items"]]
    return result


@router.post("/videos/{video_id}/ranges", response_model=RangeResponse, status_code=201)
def create_range(video_id: str, payload: RangeCreate, db: Session = Depends(get_db)):
    _get_video_or_404(db, video_id)
    _get_voice_or_404(db, payload.voice_id)
    if payload.emotion_vocab_id:
        _ensure_vocab(db, payload.emotion_vocab_id, "emotion")

    item = AnnotationRange(video_id=video_id, **payload.model_dump())
    db.add(item)
    db.commit()
    return get_range(item.id, db)


@router.delete("/videos/{video_id}", response_model=MessageResponse)
def delete_video(video_id: str, db: Session = Depends(get_db)):
    _get_video_or_404(db, video_id)
    active_range_count = db.scalar(
        select(func.count(AnnotationRange.id)).where(
            AnnotationRange.video_id == video_id,
            AnnotationRange.deleted_at.is_(None),
        )
    ) or 0
    if active_range_count:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "VIDEO_IN_USE",
                "message": "This video cannot be deleted because active ranges still reference it.",
                "active_range_count": active_range_count,
            },
        )
    video = db.scalar(select(Video).where(Video.id == video_id))
    db.delete(video)
    db.commit()
    return MessageResponse(message="Video deleted.")


@router.get("/ranges", response_model=dict)
def list_ranges(
    video_id: str | None = Query(default=None, alias="videoId"),
    voice_id: str | None = Query(default=None, alias="voiceId"),
    emotion_id: str | None = Query(default=None, alias="emotionId"),
    has_transcription: bool | None = Query(default=None, alias="hasTranscription"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    db: Session = Depends(get_db),
):
    statement = (
        select(AnnotationRange)
        .where(AnnotationRange.deleted_at.is_(None))
        .options(
            joinedload(AnnotationRange.voice),
            joinedload(AnnotationRange.video),
            joinedload(AnnotationRange.emotion),
        )
        .order_by(AnnotationRange.created_at.desc())
    )
    if video_id:
        statement = statement.where(AnnotationRange.video_id == video_id)
    if voice_id:
        statement = statement.where(AnnotationRange.voice_id == voice_id)
    if emotion_id:
        statement = statement.where(AnnotationRange.emotion_vocab_id == emotion_id)
    if has_transcription is True:
        statement = statement.where(AnnotationRange.transcription.is_not(None), AnnotationRange.transcription != "")
    if has_transcription is False:
        statement = statement.where((AnnotationRange.transcription.is_(None)) | (AnnotationRange.transcription == ""))

    result = paginate(db, statement, page, page_size)
    result["items"] = [_range_to_response(item[0]).model_dump(by_alias=True) for item in result["items"]]
    return result


@router.get("/ranges/{range_id}", response_model=RangeResponse)
def get_range(range_id: str, db: Session = Depends(get_db)):
    return _range_to_response(_get_range_or_404(db, range_id))


@router.patch("/ranges/{range_id}", response_model=RangeResponse)
def update_range(range_id: str, payload: RangeUpdate, db: Session = Depends(get_db)):
    item = _get_range_or_404(db, range_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    if item.end_ms <= item.start_ms:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_RANGE", "message": "startMs must be less than endMs."},
        )
    _get_voice_or_404(db, item.voice_id)
    if item.emotion_vocab_id:
        _ensure_vocab(db, item.emotion_vocab_id, "emotion")

    db.add(item)
    db.commit()
    return get_range(range_id, db)


@router.delete("/ranges/{range_id}", response_model=MessageResponse)
def delete_range(range_id: str, db: Session = Depends(get_db)):
    item = _get_range_or_404(db, range_id)
    item.deleted_at = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    return MessageResponse(message="Range deleted.")


@router.get("/voices", response_model=dict)
def list_voices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    include_archived: bool = Query(default=True, alias="includeArchived"),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    statement = _voice_summary_statement(include_archived)
    if q:
        statement = statement.where(Voice.name.ilike(f"%{q}%"))
    result = paginate(db, statement, page, page_size)
    result["items"] = [
        VoiceResponse(
            id=voice.id,
            created_at=voice.created_at,
            updated_at=voice.updated_at,
            name=voice.name,
            language=voice.language,
            dialect=voice.dialect,
            gender_vocab_id=voice.gender_vocab_id,
            gender_label=gender_label,
            archived=voice.archived_at is not None,
            range_count=range_count,
            total_duration_ms=total_duration_ms,
        ).model_dump(by_alias=True)
        for voice, gender_label, range_count, total_duration_ms in result["items"]
    ]
    return result


@router.post("/voices", response_model=VoiceResponse, status_code=201)
def create_voice(payload: VoiceCreate, db: Session = Depends(get_db)):
    _ensure_vocab(db, payload.gender_vocab_id, "gender")
    voice = Voice(
        name=payload.name,
        language=payload.language,
        dialect=payload.dialect,
        gender_vocab_id=payload.gender_vocab_id,
        archived_at=datetime.now(timezone.utc) if payload.archived else None,
    )
    db.add(voice)
    db.commit()
    return get_voice(voice.id, db)


@router.get("/voices/{voice_id}", response_model=VoiceResponse)
def get_voice(voice_id: str, db: Session = Depends(get_db)):
    voice = _get_voice_or_404(db, voice_id)
    range_count = db.scalar(
        select(func.count(AnnotationRange.id)).where(
            AnnotationRange.voice_id == voice_id,
            AnnotationRange.deleted_at.is_(None),
        )
    ) or 0
    total_duration = db.scalar(
        select(func.coalesce(func.sum(AnnotationRange.end_ms - AnnotationRange.start_ms), 0)).where(
            AnnotationRange.voice_id == voice_id,
            AnnotationRange.deleted_at.is_(None),
        )
    ) or 0
    return VoiceResponse(
        id=voice.id,
        created_at=voice.created_at,
        updated_at=voice.updated_at,
        name=voice.name,
        language=voice.language,
        dialect=voice.dialect,
        gender_vocab_id=voice.gender_vocab_id,
        gender_label=voice.gender.value,
        archived=voice.archived_at is not None,
        range_count=range_count,
        total_duration_ms=total_duration,
    )


@router.patch("/voices/{voice_id}", response_model=VoiceResponse)
def update_voice(voice_id: str, payload: VoiceUpdate, db: Session = Depends(get_db)):
    voice = _get_voice_or_404(db, voice_id)
    updates = payload.model_dump(exclude_unset=True)
    if "gender_vocab_id" in updates and updates["gender_vocab_id"]:
        _ensure_vocab(db, updates["gender_vocab_id"], "gender")

    archived = updates.pop("archived", None)
    for field, value in updates.items():
        setattr(voice, field, value)
    if archived is not None:
        voice.archived_at = datetime.now(timezone.utc) if archived else None

    db.add(voice)
    db.commit()
    return get_voice(voice_id, db)


@router.delete("/voices/{voice_id}", response_model=MessageResponse)
def delete_voice(voice_id: str, db: Session = Depends(get_db)):
    _get_voice_or_404(db, voice_id)
    active_range_count = db.scalar(
        select(func.count(AnnotationRange.id)).where(
            AnnotationRange.voice_id == voice_id,
            AnnotationRange.deleted_at.is_(None),
        )
    ) or 0
    if active_range_count:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "VOICE_IN_USE",
                "message": "This voice cannot be deleted because active ranges still reference it.",
                "active_range_count": active_range_count,
            },
        )
    voice = db.scalar(select(Voice).where(Voice.id == voice_id))
    db.delete(voice)
    db.commit()
    return MessageResponse(message="Voice deleted.")


@router.get("/voices/{voice_id}/duration")
def get_voice_duration(voice_id: str, db: Session = Depends(get_db)):
    _get_voice_or_404(db, voice_id)
    total_duration = db.scalar(
        select(func.coalesce(func.sum(AnnotationRange.end_ms - AnnotationRange.start_ms), 0)).where(
            AnnotationRange.voice_id == voice_id,
            AnnotationRange.deleted_at.is_(None),
        )
    ) or 0
    return {"voiceId": voice_id, "totalDurationMs": total_duration}


@router.get("/voices/{voice_id}/ranges", response_model=dict)
def get_voice_ranges(
    voice_id: str,
    has_transcription: bool | None = Query(default=None, alias="hasTranscription"),
    emotion_id: str | None = Query(default=None, alias="emotionId"),
    video_id: str | None = Query(default=None, alias="videoId"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    db: Session = Depends(get_db),
):
    _get_voice_or_404(db, voice_id)
    statement = (
        select(AnnotationRange)
        .where(AnnotationRange.voice_id == voice_id, AnnotationRange.deleted_at.is_(None))
        .options(
            joinedload(AnnotationRange.voice),
            joinedload(AnnotationRange.video),
            joinedload(AnnotationRange.emotion),
        )
        .order_by(AnnotationRange.start_ms.asc())
    )
    if video_id:
        statement = statement.where(AnnotationRange.video_id == video_id)
    if emotion_id:
        statement = statement.where(AnnotationRange.emotion_vocab_id == emotion_id)
    if has_transcription is True:
        statement = statement.where(AnnotationRange.transcription.is_not(None), AnnotationRange.transcription != "")
    if has_transcription is False:
        statement = statement.where((AnnotationRange.transcription.is_(None)) | (AnnotationRange.transcription == ""))
    result = paginate(db, statement, page, page_size)
    result["items"] = [_range_to_response(item[0]).model_dump(by_alias=True) for item in result["items"]]
    return result


@router.get("/voices/{voice_id}/stats", response_model=VoiceStatsResponse)
def get_voice_stats(voice_id: str, db: Session = Depends(get_db)):
    _get_voice_or_404(db, voice_id)
    duration_expr = AnnotationRange.end_ms - AnnotationRange.start_ms
    aggregate = db.execute(
        select(
            func.count(AnnotationRange.id),
            func.coalesce(func.sum(duration_expr), 0),
            func.coalesce(func.avg(duration_expr), 0),
            func.coalesce(func.min(duration_expr), 0),
            func.coalesce(func.max(duration_expr), 0),
            func.sum(case(((AnnotationRange.transcription.is_not(None)) & (AnnotationRange.transcription != ""), 1), else_=0)),
        ).where(AnnotationRange.voice_id == voice_id, AnnotationRange.deleted_at.is_(None))
    ).one()
    range_count, total_duration, average_duration, min_duration, max_duration, with_transcription = aggregate
    emotion_rows = db.execute(
        select(VocabularyEntry.value, func.count(AnnotationRange.id))
        .join(VocabularyEntry, AnnotationRange.emotion_vocab_id == VocabularyEntry.id)
        .where(AnnotationRange.voice_id == voice_id, AnnotationRange.deleted_at.is_(None))
        .group_by(VocabularyEntry.value)
    ).all()
    return VoiceStatsResponse(
        voice_id=voice_id,
        range_count=range_count or 0,
        total_duration_ms=int(total_duration or 0),
        average_duration_ms=int(average_duration or 0),
        min_duration_ms=int(min_duration or 0),
        max_duration_ms=int(max_duration or 0),
        with_transcription_count=int(with_transcription or 0),
        without_transcription_count=int((range_count or 0) - (with_transcription or 0)),
        emotion_counts={value: count for value, count in emotion_rows},
    )


@router.get("/vocabularies")
def list_vocabulary_types():
    return {"items": [{"type": "gender"}, {"type": "emotion"}]}


@router.get("/vocabularies/{vocab_type}/entries", response_model=list[VocabularyEntryResponse])
def list_vocabulary_entries(vocab_type: str, db: Session = Depends(get_db)):
    if vocab_type not in {"gender", "emotion"}:
        raise HTTPException(status_code=404, detail="Vocabulary type not found")

    voice_usage = (
        select(Voice.gender_vocab_id.label("vocab_id"), func.count(Voice.id).label("usage_count"))
        .where(vocab_type == "gender")
        .group_by(Voice.gender_vocab_id)
    )
    range_usage = (
        select(AnnotationRange.emotion_vocab_id.label("vocab_id"), func.count(AnnotationRange.id).label("usage_count"))
        .where(vocab_type == "emotion", AnnotationRange.deleted_at.is_(None))
        .group_by(AnnotationRange.emotion_vocab_id)
    )

    entries = db.scalars(
        select(VocabularyEntry)
        .where(VocabularyEntry.type == vocab_type)
        .order_by(VocabularyEntry.is_active.desc(), VocabularyEntry.value.asc())
    ).all()

    if vocab_type == "gender":
        usage_map = dict(db.execute(select(Voice.gender_vocab_id, func.count(Voice.id)).group_by(Voice.gender_vocab_id)).all())
    else:
        usage_map = dict(
            db.execute(
                select(AnnotationRange.emotion_vocab_id, func.count(AnnotationRange.id))
                .where(AnnotationRange.deleted_at.is_(None))
                .group_by(AnnotationRange.emotion_vocab_id)
            ).all()
        )

    return [
        VocabularyEntryResponse(
            id=entry.id,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            type=entry.type,
            value=entry.value,
            is_active=entry.is_active,
            usage_count=int(usage_map.get(entry.id) or 0),
        )
        for entry in entries
    ]


@router.get("/vocabularies/{vocab_type}/entries/paged", response_model=dict)
def list_vocabulary_entries_paged(
    vocab_type: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    db: Session = Depends(get_db),
):
    if vocab_type not in {"gender", "emotion"}:
        raise HTTPException(status_code=404, detail="Vocabulary type not found")

    statement = (
        select(VocabularyEntry)
        .where(VocabularyEntry.type == vocab_type)
        .order_by(VocabularyEntry.is_active.desc(), VocabularyEntry.value.asc())
    )
    result = paginate(db, statement, page, page_size)

    if vocab_type == "gender":
        usage_map = dict(db.execute(select(Voice.gender_vocab_id, func.count(Voice.id)).group_by(Voice.gender_vocab_id)).all())
    else:
        usage_map = dict(
            db.execute(
                select(AnnotationRange.emotion_vocab_id, func.count(AnnotationRange.id))
                .where(AnnotationRange.deleted_at.is_(None))
                .group_by(AnnotationRange.emotion_vocab_id)
            ).all()
        )

    result["items"] = [
        VocabularyEntryResponse(
            id=entry.id,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            type=entry.type,
            value=entry.value,
            is_active=entry.is_active,
            usage_count=int(usage_map.get(entry.id) or 0),
        ).model_dump(by_alias=True)
        for (entry,) in result["items"]
    ]
    return result


@router.post("/vocabularies/{vocab_type}/entries", response_model=VocabularyEntryResponse, status_code=201)
def create_vocabulary_entry(vocab_type: str, payload: VocabularyEntryCreate, db: Session = Depends(get_db)):
    if vocab_type not in {"gender", "emotion"}:
        raise HTTPException(status_code=404, detail="Vocabulary type not found")
    entry = VocabularyEntry(type=vocab_type, **payload.model_dump())
    db.add(entry)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_VOCABULARY_VALUE", "message": "The vocabulary value must be unique within its type."},
        )
    db.refresh(entry)
    return VocabularyEntryResponse(
        id=entry.id,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        type=entry.type,
        value=entry.value,
        is_active=entry.is_active,
        usage_count=0,
    )


@router.patch("/vocabularies/{vocab_type}/entries/{entry_id}", response_model=VocabularyEntryResponse)
def update_vocabulary_entry(vocab_type: str, entry_id: str, payload: VocabularyEntryUpdate, db: Session = Depends(get_db)):
    entry = db.scalar(select(VocabularyEntry).where(VocabularyEntry.id == entry_id, VocabularyEntry.type == vocab_type))
    if not entry:
        raise HTTPException(status_code=404, detail="Vocabulary entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    try:
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_VOCABULARY_VALUE", "message": "The vocabulary value must be unique within its type."},
        )
    usage_count = 0
    if vocab_type == "gender":
        usage_count = db.scalar(select(func.count(Voice.id)).where(Voice.gender_vocab_id == entry.id)) or 0
    else:
        usage_count = db.scalar(
            select(func.count(AnnotationRange.id)).where(
                AnnotationRange.emotion_vocab_id == entry.id,
                AnnotationRange.deleted_at.is_(None),
            )
        ) or 0
    return VocabularyEntryResponse(
        id=entry.id,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        type=entry.type,
        value=entry.value,
        is_active=entry.is_active,
        usage_count=usage_count,
    )


@router.delete("/vocabularies/{vocab_type}/entries/{entry_id}", response_model=MessageResponse)
def delete_vocabulary_entry(vocab_type: str, entry_id: str, db: Session = Depends(get_db)):
    entry = db.scalar(select(VocabularyEntry).where(VocabularyEntry.id == entry_id, VocabularyEntry.type == vocab_type))
    if not entry:
        raise HTTPException(status_code=404, detail="Vocabulary entry not found")
    if vocab_type == "gender":
        usage_count = db.scalar(select(func.count(Voice.id)).where(Voice.gender_vocab_id == entry.id)) or 0
    else:
        usage_count = db.scalar(
            select(func.count(AnnotationRange.id)).where(
                AnnotationRange.emotion_vocab_id == entry.id,
                AnnotationRange.deleted_at.is_(None),
            )
        ) or 0
    if usage_count:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "VOCABULARY_ENTRY_IN_USE",
                "message": "This vocabulary entry cannot be deleted because it is currently in use.",
                "usage_count": usage_count,
            },
        )
    db.delete(entry)
    db.commit()
    return MessageResponse(message="Vocabulary entry deleted.")


@router.get("/admin/voices", response_model=dict)
def admin_list_voices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    language: str | None = None,
    dialect: str | None = None,
    gender_id: str | None = Query(default=None, alias="genderId"),
    q: str | None = None,
    db: Session = Depends(get_db),
):
    statement = _voice_summary_statement(include_archived=True)
    if language:
        statement = statement.where(Voice.language == language)
    if dialect:
        statement = statement.where(Voice.dialect == dialect)
    if gender_id:
        statement = statement.where(Voice.gender_vocab_id == gender_id)
    if q:
        pattern = f"%{q}%"
        statement = statement.where(
            Voice.name.ilike(pattern) | Voice.language.ilike(pattern) | Voice.dialect.ilike(pattern)
        )
    result = paginate(db, statement, page, page_size)
    result["items"] = [
        {
            "id": voice.id,
            "name": voice.name,
            "language": voice.language,
            "dialect": voice.dialect,
            "genderLabel": gender_label,
            "rangeCount": int(range_count or 0),
            "totalDurationMs": int(total_duration_ms or 0),
            "archived": voice.archived_at is not None,
        }
        for voice, gender_label, range_count, total_duration_ms in result["items"]
    ]
    return result


@router.get("/admin/voices/{voice_id}")
def admin_get_voice(voice_id: str, db: Session = Depends(get_db)):
    voice = get_voice(voice_id, db)
    stats = get_voice_stats(voice_id, db)
    return {"voice": voice.model_dump(by_alias=True), "stats": stats.model_dump(by_alias=True)}


@router.get("/admin/voices/{voice_id}/ranges", response_model=dict)
def admin_get_voice_ranges(
    voice_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size, alias="pageSize"),
    video_id: str | None = Query(default=None, alias="videoId"),
    emotion_id: str | None = Query(default=None, alias="emotionId"),
    has_transcription: bool | None = Query(default=None, alias="hasTranscription"),
    db: Session = Depends(get_db),
):
    return get_voice_ranges(
        voice_id=voice_id,
        has_transcription=has_transcription,
        emotion_id=emotion_id,
        page=page,
        page_size=page_size,
        db=db,
    )


@router.get("/admin/voices/{voice_id}/stats", response_model=VoiceStatsResponse)
def admin_get_voice_stats(voice_id: str, db: Session = Depends(get_db)):
    return get_voice_stats(voice_id, db)
