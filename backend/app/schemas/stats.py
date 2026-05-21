from pydantic import BaseModel


class VoiceStatsResponse(BaseModel):
    voice_id: str
    range_count: int
    total_duration_ms: int
    average_duration_ms: int
    min_duration_ms: int
    max_duration_ms: int
    with_transcription_count: int
    without_transcription_count: int
    emotion_counts: dict[str, int]

