"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { Panel } from "@/components/panel";
import { PaginationControls } from "@/components/pagination-controls";
import { RangeEditor } from "@/components/range-editor";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/time";
import type { AnnotationRange } from "@/lib/types";


export default function VoicesPage() {
  const queryClient = useQueryClient();
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", language: "", dialect: "", genderVocabId: "", archived: false });
  const [banner, setBanner] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [playingRange, setPlayingRange] = useState<{ rangeId: string; endMs: number } | null>(null);
  const [voicesPage, setVoicesPage] = useState(1);
  const [voiceVideosPage, setVoiceVideosPage] = useState(1);
  const [voiceRangesPage, setVoiceRangesPage] = useState(1);

  const voicesQuery = useQuery({
    queryKey: ["voices", "all", voicesPage],
    queryFn: () => api.listVoices(`?includeArchived=true&page=${voicesPage}&pageSize=8`),
  });
  const gendersQuery = useQuery({
    queryKey: ["vocabulary", "gender"],
    queryFn: () => api.listVocabulary("gender"),
  });
  const emotionsQuery = useQuery({
    queryKey: ["vocabulary", "emotion"],
    queryFn: () => api.listVocabulary("emotion"),
  });
  const selectedVoiceQuery = useQuery({
    queryKey: ["voice", selectedId],
    queryFn: () => api.getVoice(selectedId!),
    enabled: Boolean(selectedId),
  });
  const voiceVideosQuery = useQuery({
    queryKey: ["voice-videos", selectedId, voiceVideosPage],
    queryFn: () => api.getVoiceVideos(selectedId!, `?page=${voiceVideosPage}&pageSize=6`),
    enabled: Boolean(selectedId),
  });
  const voiceRangesQuery = useQuery({
    queryKey: ["voice-ranges", selectedId, selectedVideoId, voiceRangesPage],
    queryFn: () =>
      api.getVoiceRanges(
        selectedId!,
        `?page=${voiceRangesPage}&pageSize=8${selectedVideoId ? `&videoId=${encodeURIComponent(selectedVideoId)}` : ""}`,
      ),
    enabled: Boolean(selectedId),
  });

  const selectedVoice = selectedVoiceQuery.data || null;
  const voiceVideos = voiceVideosQuery.data?.items || [];

  const selectedVideo = useMemo(
    () => voiceVideos.find((video) => video.id === selectedVideoId) || null,
    [selectedVideoId, voiceVideos],
  );

  const filteredRanges = voiceRangesQuery.data?.items || [];

  useEffect(() => {
    if (!voiceVideos.length) {
      setSelectedVideoId(null);
      return;
    }
    if (!selectedVideoId || !voiceVideos.some((video) => video.id === selectedVideoId)) {
      setSelectedVideoId(voiceVideos[0].id);
    }
  }, [selectedVideoId, voiceVideos]);

  useEffect(() => {
    setVoiceRangesPage(1);
  }, [selectedVideoId]);

  useEffect(() => {
    if (!playingRange) return;
    if (currentTimeMs >= playingRange.endMs) {
      playerRef.current?.pause();
      setPlayingRange(null);
    }
  }, [currentTimeMs, playingRange]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedId) {
        return api.updateVoice(selectedId, form);
      }
      return api.createVoice(form);
    },
    onSuccess: async (voice) => {
      setSelectedId(voice.id);
      setBanner("Voice saved.");
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      await queryClient.invalidateQueries({ queryKey: ["voice", voice.id] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteVoice(selectedId!),
    onSuccess: async () => {
      setSelectedId(null);
      setSelectedVideoId(null);
      setForm({ name: "", language: "", dialect: "", genderVocabId: "", archived: false });
      setBanner("Voice deleted.");
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      await queryClient.invalidateQueries({ queryKey: ["voice-ranges"] });
      await queryClient.invalidateQueries({ queryKey: ["voice-videos"] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const updateRangeMutation = useMutation({
    mutationFn: ({ rangeId, payload }: { rangeId: string; payload: Record<string, unknown> }) => api.updateRange(rangeId, payload),
    onSuccess: async () => {
      setEditingRangeId(null);
      setBanner("Range updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voice-ranges", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["voice-videos", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["voices"] }),
        queryClient.invalidateQueries({ queryKey: ["video-ranges"] }),
        queryClient.invalidateQueries({ queryKey: ["videos"] }),
      ]);
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const deleteRangeMutation = useMutation({
    mutationFn: api.deleteRange,
    onSuccess: async () => {
      setEditingRangeId(null);
      setBanner("Range deleted.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voice-ranges", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["voice-videos", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["voices"] }),
        queryClient.invalidateQueries({ queryKey: ["video-ranges"] }),
        queryClient.invalidateQueries({ queryKey: ["videos"] }),
      ]);
    },
    onError: (error: Error) => setBanner(error.message),
  });

  function loadVoice(voiceId: string) {
    const voice = voicesQuery.data?.items.find((item) => item.id === voiceId);
    if (!voice) return;
    setSelectedId(voice.id);
    setSelectedVideoId(null);
    setEditingRangeId(null);
    setPlayingRange(null);
    setVoiceVideosPage(1);
    setVoiceRangesPage(1);
    setForm({
      name: voice.name,
      language: voice.language,
      dialect: voice.dialect,
      genderVocabId: voice.gender_vocab_id,
      archived: voice.archived,
    });
  }

  function playRange(range: AnnotationRange) {
    if (selectedVideo?.youtube_video_id !== range.youtube_video_id) {
      setSelectedVideoId(range.video_id);
      window.setTimeout(() => {
        playerRef.current?.seekToMs(range.start_ms);
        playerRef.current?.play();
        setPlayingRange({ rangeId: range.id, endMs: range.end_ms });
      }, 200);
      return;
    }
    playerRef.current?.seekToMs(range.start_ms);
    playerRef.current?.play();
    setPlayingRange({ rangeId: range.id, endMs: range.end_ms });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Panel title="Voices" subtitle="Select a voice to manage its profile, videos, and collected extracts.">
        <div className="space-y-3">
          <button
            className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              setSelectedId(null);
              setSelectedVideoId(null);
              setEditingRangeId(null);
              setVoicesPage(1);
              setForm({ name: "", language: "", dialect: "", genderVocabId: "", archived: false });
            }}
            type="button"
          >
            New Voice
          </button>
          {voicesQuery.data?.items.map((voice) => (
            <button
              key={voice.id}
              className={`w-full rounded-2xl border p-3 text-left ${selectedId === voice.id ? "border-accent bg-mist" : "border-line bg-white"}`}
              onClick={() => loadVoice(voice.id)}
              type="button"
            >
              <div className="font-semibold">{voice.name}</div>
              <div className="mt-1 text-sm text-slate-500">
                {voice.language} / {voice.dialect} / {voice.gender_label}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">
                {voice.range_count} ranges • {formatDuration(voice.total_duration_ms)}
              </div>
            </button>
          ))}
        </div>
        {voicesQuery.data ? (
          <PaginationControls
            page={voicesQuery.data.page}
            pageSize={voicesQuery.data.page_size}
            totalItems={voicesQuery.data.total_items}
            totalPages={voicesQuery.data.total_pages}
            onPageChange={setVoicesPage}
          />
        ) : null}
      </Panel>

      <div className="space-y-6">
        <Panel title={selectedId ? "Edit Voice" : "Create Voice"} subtitle="Deleting is blocked when active ranges still reference the voice.">
          {banner ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{banner}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field label="Language">
              <input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
            </Field>
            <Field label="Dialect">
              <input value={form.dialect} onChange={(event) => setForm({ ...form, dialect: event.target.value })} />
            </Field>
            <Field label="Gender">
              <select value={form.genderVocabId} onChange={(event) => setForm({ ...form, genderVocabId: event.target.value })}>
                <option value="">Select gender</option>
                {gendersQuery.data?.filter((entry) => entry.is_active).map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.value}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <input checked={form.archived} onChange={(event) => setForm({ ...form, archived: event.target.checked })} type="checkbox" />
            Archived voices stay visible historically but are hidden from new selections by default.
          </label>

          {selectedVoice ? (
            <div className="mt-4 rounded-2xl border border-line bg-mist p-4 text-sm text-slate-600">
              <div>Total duration: {formatDuration(selectedVoice.total_duration_ms)}</div>
              <div>Total ranges: {selectedVoice.range_count}</div>
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white" onClick={() => saveMutation.mutate()} type="button">
              {selectedId ? "Save Voice" : "Create Voice"}
            </button>
            {selectedId ? (
              <button className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => deleteMutation.mutate()} type="button">
                Delete Voice
              </button>
            ) : null}
          </div>
        </Panel>

        {selectedVoice ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
              <Panel title="Videos For Voice" subtitle="Choose a source video for playback and range review.">
                <div className="space-y-3">
                  {voiceVideos.length ? (
                    voiceVideos.map((video) => (
                      <button
                        key={video.id}
                        className={`w-full rounded-2xl border p-3 text-left ${selectedVideoId === video.id ? "border-accent bg-mist" : "border-line bg-white"}`}
                        onClick={() => {
                          setSelectedVideoId(video.id);
                          setPlayingRange(null);
                        }}
                        type="button"
                      >
                        <div className="font-mono text-xs text-slate-500">{video.youtube_video_id}</div>
                        <div className="mt-2 line-clamp-2 text-sm text-ink">{video.source_url}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">
                          {video.range_count} ranges • {formatDuration(video.total_duration_ms)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-500">
                      No extracts exist for this voice yet.
                    </div>
                  )}
                </div>
                {voiceVideosQuery.data ? (
                  <PaginationControls
                    page={voiceVideosQuery.data.page}
                    pageSize={voiceVideosQuery.data.page_size}
                    totalItems={voiceVideosQuery.data.total_items}
                    totalPages={voiceVideosQuery.data.total_pages}
                    onPageChange={setVoiceVideosPage}
                  />
                ) : null}
              </Panel>

              <Panel title="Playback" subtitle="Review one source video at a time while keeping the selected voice in context.">
                <YouTubePlayer
                  currentTimeMs={currentTimeMs}
                  onCurrentTimeChange={setCurrentTimeMs}
                  playerRef={playerRef}
                  videoId={selectedVideo?.youtube_video_id ?? null}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-mist px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Current time</div>
                    <div className="text-lg font-semibold">{formatDuration(currentTimeMs)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium" onClick={() => playerRef.current?.play()} type="button">
                      Play
                    </button>
                    <button
                      className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium"
                      onClick={() => {
                        playerRef.current?.pause();
                        setPlayingRange(null);
                      }}
                      type="button"
                    >
                      Pause
                    </button>
                    {selectedVideo ? (
                      <a
                        className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium"
                        href={selectedVideo.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open YouTube
                      </a>
                    ) : null}
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Extracts For Voice" subtitle="Ranges are filtered to the selected video and can be played, edited, or deleted.">
              <div className="mb-4 text-sm text-slate-500">
                {selectedVideo
                  ? `${voiceRangesQuery.data?.total_items ?? filteredRanges.length} ranges in selected video`
                  : "Select a video to review extracts"}
              </div>
              <div className="space-y-3">
                {filteredRanges.map((range) =>
                  editingRangeId === range.id ? (
                    <RangeEditor
                      key={range.id}
                      currentTimeMs={currentTimeMs}
                      emotions={emotionsQuery.data || []}
                      onCancel={() => setEditingRangeId(null)}
                      onDelete={async () => {
                        await deleteRangeMutation.mutateAsync(range.id);
                      }}
                      onSave={async (payload) => {
                        await updateRangeMutation.mutateAsync({ rangeId: range.id, payload });
                      }}
                      range={range}
                      voices={voicesQuery.data?.items || []}
                    />
                  ) : (
                    <VoiceRangeRow
                      key={range.id}
                      isPlaying={playingRange?.rangeId === range.id}
                      onEdit={() => setEditingRangeId(range.id)}
                      onPlay={() => playRange(range)}
                      onSeek={() => playerRef.current?.seekToMs(range.start_ms)}
                      range={range}
                    />
                  ),
                )}
                {!filteredRanges.length ? (
                  <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate-500">
                    No extracts found for this voice in the selected video.
                  </div>
                ) : null}
              </div>
              {voiceRangesQuery.data ? (
                <PaginationControls
                  page={voiceRangesQuery.data.page}
                  pageSize={voiceRangesQuery.data.page_size}
                  totalItems={voiceRangesQuery.data.total_items}
                  totalPages={voiceRangesQuery.data.total_pages}
                  onPageChange={setVoiceRangesPage}
                />
              ) : null}
            </Panel>
          </>
        ) : null}
      </div>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}


function VoiceRangeRow({
  range,
  onPlay,
  onSeek,
  onEdit,
  isPlaying,
}: {
  range: AnnotationRange;
  onPlay: () => void;
  onSeek: () => void;
  onEdit: () => void;
  isPlaying: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="rounded-xl bg-mist px-3 py-2 text-sm font-semibold text-slate-600">{formatDuration(range.duration_ms)}</div>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">{formatDuration(range.start_ms)}</span>
          <span className="text-slate-400">to</span>
          <span className="font-semibold">{formatDuration(range.end_ms)}</span>
          {range.emotion_label ? <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium">{range.emotion_label}</span> : null}
          {isPlaying ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Playing</span> : null}
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {range.transcription ? range.transcription : "No transcription yet"}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium" onClick={onSeek} type="button">
          Seek
        </button>
        <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium" onClick={onPlay} type="button">
          Play Range
        </button>
        <button className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white" onClick={onEdit} type="button">
          Edit
        </button>
      </div>
    </div>
  );
}
