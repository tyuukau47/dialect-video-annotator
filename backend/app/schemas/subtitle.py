from typing import Literal

from pydantic import BaseModel


class SubtitleSuggestionResponse(BaseModel):
    youtube_video_id: str
    language_code: str
    source_type: str
    text: str
    matched_segment_count: int
    coverage: Literal["none", "partial", "full"]
    range_start_ms: int
    range_end_ms: int
