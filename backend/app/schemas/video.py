from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import TimestampedSchema


class VideoResolveRequest(BaseModel):
    youtube_url: str = Field(validation_alias="youtubeUrl", min_length=5)

    model_config = ConfigDict(populate_by_name=True)


class VideoResponse(TimestampedSchema):
    youtube_video_id: str
    source_url: str
    title: str | None = None


class VideoResolveResponse(BaseModel):
    id: str
    youtube_video_id: str
    youtube_url: str


class VideoSummaryResponse(TimestampedSchema):
    youtube_video_id: str
    source_url: str
    title: str | None = None
    range_count: int = 0
    total_duration_ms: int = 0
