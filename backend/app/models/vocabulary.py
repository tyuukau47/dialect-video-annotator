from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class VocabularyEntry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vocabulary_entries"
    __table_args__ = (Index("ix_vocab_type_value_unique", "type", "value", unique=True),)

    type: Mapped[str] = mapped_column(String(32), index=True)
    value: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    voices = relationship("Voice", back_populates="gender")
    ranges = relationship("AnnotationRange", back_populates="emotion")

