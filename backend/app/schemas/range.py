from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import TimestampedSchema


class RangeBase(BaseModel):
    start_ms: int = Field(validation_alias="startMs", ge=0)
    end_ms: int = Field(validation_alias="endMs", ge=0)
    voice_id: str = Field(validation_alias="voiceId")
    transcription: str | None = None
    emotion_vocab_id: str | None = Field(default=None, validation_alias="emotionId")
    note: str | None = None

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_range(self) -> "RangeBase":
        if self.end_ms <= self.start_ms:
            raise ValueError("startMs must be less than endMs.")
        return self


class RangeCreate(RangeBase):
    pass


class RangeUpdate(BaseModel):
    start_ms: int | None = Field(default=None, validation_alias="startMs", ge=0)
    end_ms: int | None = Field(default=None, validation_alias="endMs", ge=0)
    voice_id: str | None = Field(default=None, validation_alias="voiceId")
    transcription: str | None = None
    emotion_vocab_id: str | None = Field(default=None, validation_alias="emotionId")
    note: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class RangeResponse(TimestampedSchema):
    video_id: str
    voice_id: str
    voice_name: str
    start_ms: int
    end_ms: int
    duration_ms: int
    transcription: str | None = None
    emotion_vocab_id: str | None = None
    emotion_label: str | None = None
    note: str | None = None
    source_url: str
    youtube_video_id: str

    model_config = {"from_attributes": True}
