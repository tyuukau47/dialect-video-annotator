export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type VideoResolveResponse = {
  id: string;
  youtube_video_id: string;
  youtube_url: string;
};

export type VideoSummary = {
  id: string;
  youtube_video_id: string;
  source_url: string;
  title: string | null;
  range_count: number;
  total_duration_ms: number;
};

export type Voice = {
  id: string;
  name: string;
  language: string;
  dialect: string;
  gender_vocab_id: string;
  gender_label: string;
  archived: boolean;
  range_count: number;
  total_duration_ms: number;
};

export type VocabularyEntry = {
  id: string;
  type: "gender" | "emotion";
  value: string;
  is_active: boolean;
  usage_count: number;
};

export type AnnotationRange = {
  id: string;
  video_id: string;
  voice_id: string;
  voice_name: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  transcription: string | null;
  emotion_vocab_id: string | null;
  emotion_label: string | null;
  note: string | null;
  source_url: string;
  youtube_video_id: string;
};

export type SubtitleSuggestion = {
  youtube_video_id: string;
  language_code: string;
  source_type: string;
  text: string;
  matched_cue_count: number;
  coverage: "none" | "partial" | "full";
  range_start_ms: number;
  range_end_ms: number;
};

export type VoiceStats = {
  voice_id: string;
  range_count: number;
  total_duration_ms: number;
  average_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  with_transcription_count: number;
  without_transcription_count: number;
  emotion_counts: Record<string, number>;
};

export type AdminVoiceSummary = {
  id: string;
  name: string;
  language: string;
  dialect: string;
  genderLabel: string;
  rangeCount: number;
  totalDurationMs: number;
  archived: boolean;
};
