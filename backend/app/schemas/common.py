from datetime import datetime

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: list
    page: int
    page_size: int
    total_items: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    error: str
    message: str
    usage_count: int | None = None
    active_range_count: int | None = None


class TimestampedSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

