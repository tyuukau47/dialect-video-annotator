from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Video(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "videos"

    youtube_video_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    source_url: Mapped[str] = mapped_column(String(512))
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    ranges = relationship("AnnotationRange", back_populates="video")

