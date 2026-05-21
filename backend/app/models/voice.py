from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Voice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "voices"

    name: Mapped[str] = mapped_column(String(120), index=True)
    language: Mapped[str] = mapped_column(String(120), index=True)
    dialect: Mapped[str] = mapped_column(String(120), index=True)
    gender_vocab_id: Mapped[str] = mapped_column(ForeignKey("vocabulary_entries.id"), index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    gender = relationship("VocabularyEntry", back_populates="voices")
    ranges = relationship("AnnotationRange", back_populates="voice")

