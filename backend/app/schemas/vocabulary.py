from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema


class VocabularyEntryCreate(BaseModel):
    value: str = Field(min_length=1, max_length=120)
    is_active: bool = True


class VocabularyEntryUpdate(BaseModel):
    value: str | None = Field(default=None, min_length=1, max_length=120)
    is_active: bool | None = None


class VocabularyEntryResponse(TimestampedSchema):
    type: str
    value: str
    is_active: bool
    usage_count: int = 0

