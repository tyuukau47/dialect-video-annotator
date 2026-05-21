from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AnnotationRange(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ranges"

    video_id: Mapped[str] = mapped_column(ForeignKey("videos.id"), index=True)
    voice_id: Mapped[str] = mapped_column(ForeignKey("voices.id"), index=True)
    start_ms: Mapped[int] = mapped_column(Integer, index=True)
    end_ms: Mapped[int] = mapped_column(Integer, index=True)
    transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotion_vocab_id: Mapped[str | None] = mapped_column(ForeignKey("vocabulary_entries.id"), nullable=True, index=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    video = relationship("Video", back_populates="ranges")
    voice = relationship("Voice", back_populates="ranges")
    emotion = relationship("VocabularyEntry", back_populates="ranges")

