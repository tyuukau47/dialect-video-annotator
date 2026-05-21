from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import TimestampedSchema


class VoiceBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    language: str = Field(min_length=1, max_length=120)
    dialect: str = Field(min_length=1, max_length=120)
    gender_vocab_id: str = Field(validation_alias="genderVocabId")
    archived: bool = False

    model_config = ConfigDict(populate_by_name=True)


class VoiceCreate(VoiceBase):
    pass


class VoiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    language: str | None = Field(default=None, min_length=1, max_length=120)
    dialect: str | None = Field(default=None, min_length=1, max_length=120)
    gender_vocab_id: str | None = Field(default=None, validation_alias="genderVocabId")
    archived: bool | None = None

    model_config = ConfigDict(populate_by_name=True)


class VoiceResponse(TimestampedSchema):
    name: str
    language: str
    dialect: str
    gender_vocab_id: str
    gender_label: str
    archived: bool
    range_count: int = 0
    total_duration_ms: int = 0

    model_config = {"from_attributes": True}
