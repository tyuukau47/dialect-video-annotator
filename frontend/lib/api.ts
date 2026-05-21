import type {
  AdminVoiceSummary,
  AnnotationRange,
  Paginated,
  VideoResolveResponse,
  VideoSummary,
  VocabularyEntry,
  Voice,
  VoiceStats,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload?.detail?.message || payload?.message || payload?.detail || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  config: () => request<{ timestampFormat: string; defaultPageSize: number; maxPageSize: number }>("/config"),
  resolveVideo: (youtubeUrl: string) =>
    request<VideoResolveResponse>("/videos/resolve", {
      method: "POST",
      body: JSON.stringify({ youtubeUrl }),
    }),
  listVideos: (query = "") => request<Paginated<VideoSummary>>(`/videos${query}`),
  deleteVideo: (videoId: string) =>
    request<{ message: string }>(`/videos/${videoId}`, {
      method: "DELETE",
    }),
  getVideoRanges: (videoId: string) => request<Paginated<AnnotationRange>>(`/videos/${videoId}/ranges`),
  createRange: (videoId: string, payload: Record<string, unknown>) =>
    request<AnnotationRange>(`/videos/${videoId}/ranges`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRange: (rangeId: string, payload: Record<string, unknown>) =>
    request<AnnotationRange>(`/ranges/${rangeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteRange: (rangeId: string) =>
    request<{ message: string }>(`/ranges/${rangeId}`, {
      method: "DELETE",
    }),
  listVoices: (query = "") => request<Paginated<Voice>>(`/voices${query}`),
  getVoice: (voiceId: string) => request<Voice>(`/voices/${voiceId}`),
  getVoiceRanges: (voiceId: string, query = "") => request<Paginated<AnnotationRange>>(`/voices/${voiceId}/ranges${query}`),
  createVoice: (payload: Record<string, unknown>) =>
    request<Voice>("/voices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateVoice: (voiceId: string, payload: Record<string, unknown>) =>
    request<Voice>(`/voices/${voiceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteVoice: (voiceId: string) =>
    request<{ message: string }>(`/voices/${voiceId}`, {
      method: "DELETE",
    }),
  listVocabulary: (type: "gender" | "emotion") => request<VocabularyEntry[]>(`/vocabularies/${type}/entries`),
  createVocabulary: (type: "gender" | "emotion", payload: Record<string, unknown>) =>
    request<VocabularyEntry>(`/vocabularies/${type}/entries`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateVocabulary: (type: "gender" | "emotion", id: string, payload: Record<string, unknown>) =>
    request<VocabularyEntry>(`/vocabularies/${type}/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteVocabulary: (type: "gender" | "emotion", id: string) =>
    request<{ message: string }>(`/vocabularies/${type}/entries/${id}`, {
      method: "DELETE",
    }),
  adminVoices: (query = "") => request<Paginated<AdminVoiceSummary>>(`/admin/voices${query}`),
  adminVoiceDetail: (voiceId: string) =>
    request<{ voice: Voice; stats: VoiceStats }>(`/admin/voices/${voiceId}`),
  adminVoiceRanges: (voiceId: string, query = "") =>
    request<Paginated<AnnotationRange>>(`/admin/voices/${voiceId}/ranges${query}`),
  adminVoiceStats: (voiceId: string) => request<VoiceStats>(`/admin/voices/${voiceId}/stats`),
};
