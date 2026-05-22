from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import json
from pathlib import Path
import re


_FILENAME_RE = re.compile(r"^(?P<youtube_video_id>[^.]+)\.(?P<language_code>[^.]+)\.json3$")
_WHITESPACE_RE = re.compile(r"\s+")
_NON_SPEECH_RE = re.compile(r"^\[[^\]]+\]$")


@dataclass(frozen=True)
class SubtitleCue:
    position: int
    start_ms: int
    end_ms: int
    text: str


@dataclass(frozen=True)
class SubtitleTrack:
    youtube_video_id: str
    language_code: str
    source_type: str
    original_filename: str
    cues: tuple[SubtitleCue, ...]


def get_subtitle_suggestion(
    subtitle_root_dir: str | None,
    youtube_video_id: str,
    start_ms: int,
    end_ms: int,
    language_code: str | None = None,
) -> dict | None:
    track = load_subtitle_track(subtitle_root_dir, youtube_video_id, language_code)
    if track is None:
        return None

    cues = [cue for cue in track.cues if cue.start_ms < end_ms and cue.end_ms > start_ms]
    text = " ".join(cue.text for cue in cues).strip()
    if not text:
        coverage = "none"
    else:
        coverage_start = min(cue.start_ms for cue in cues)
        coverage_end = max(cue.end_ms for cue in cues)
        coverage = "full" if coverage_start <= start_ms and coverage_end >= end_ms else "partial"

    return {
        "youtube_video_id": youtube_video_id,
        "language_code": track.language_code,
        "source_type": track.source_type,
        "text": text,
        "matched_cue_count": len(cues),
        "coverage": coverage,
        "range_start_ms": start_ms,
        "range_end_ms": end_ms,
    }


def load_subtitle_track(
    subtitle_root_dir: str | None,
    youtube_video_id: str,
    language_code: str | None = None,
) -> SubtitleTrack | None:
    if not subtitle_root_dir:
        return None

    root_dir = Path(subtitle_root_dir)
    if not root_dir.exists() or not root_dir.is_dir():
        return None

    candidate = _find_subtitle_file(root_dir, youtube_video_id, language_code)
    if candidate is None:
        return None

    stat = candidate.stat()
    return _load_subtitle_track_cached(str(candidate), stat.st_mtime_ns, stat.st_size)


def parse_json3_subtitle_file(path: str | Path, source_type: str = "youtube_auto_subtitle") -> SubtitleTrack:
    file_path = Path(path)
    match = _FILENAME_RE.match(file_path.name)
    if not match:
        raise ValueError(f"Unsupported subtitle filename: {file_path.name}")

    with file_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    events = payload.get("events")
    if not isinstance(events, list):
        raise ValueError(f"Subtitle file is missing an events array: {file_path.name}")

    cues: list[SubtitleCue] = []
    for index, event in enumerate(events):
        if not isinstance(event, dict):
            continue
        segs = event.get("segs")
        if not isinstance(segs, list):
            continue

        raw_text = "".join(seg.get("utf8", "") for seg in segs if isinstance(seg, dict))
        text = _WHITESPACE_RE.sub(" ", raw_text.replace("\n", " ")).strip()
        if not text or _NON_SPEECH_RE.fullmatch(text):
            continue

        start_ms = int(event.get("tStartMs", 0))
        duration_ms = event.get("dDurationMs")
        if duration_ms is None:
            next_start_ms = _find_next_start_ms(events, index)
            duration_ms = max(next_start_ms - start_ms, 0) if next_start_ms is not None else 0

        end_ms = max(start_ms + int(duration_ms), start_ms + 1)
        cues.append(
            SubtitleCue(
                position=len(cues),
                start_ms=start_ms,
                end_ms=end_ms,
                text=text,
            )
        )

    return SubtitleTrack(
        youtube_video_id=match.group("youtube_video_id"),
        language_code=match.group("language_code"),
        source_type=source_type,
        original_filename=file_path.name,
        cues=tuple(cues),
    )


def _find_subtitle_file(root_dir: Path, youtube_video_id: str, language_code: str | None) -> Path | None:
    preferred_languages = [language_code] if language_code else ["vi", "en"]
    for code in preferred_languages:
        if not code:
            continue
        candidate = root_dir / f"{youtube_video_id}.{code}.json3"
        if candidate.is_file():
            return candidate

    fallback_matches = sorted(root_dir.glob(f"{youtube_video_id}.*.json3"))
    return fallback_matches[0] if fallback_matches else None


@lru_cache(maxsize=256)
def _load_subtitle_track_cached(path: str, mtime_ns: int, size: int) -> SubtitleTrack:
    del mtime_ns, size
    return parse_json3_subtitle_file(path)


def _find_next_start_ms(events: list[dict], current_index: int) -> int | None:
    for next_index in range(current_index + 1, len(events)):
        candidate = events[next_index]
        if not isinstance(candidate, dict):
            continue
        next_start_ms = candidate.get("tStartMs")
        if next_start_ms is None:
            continue
        return int(next_start_ms)
    return None
