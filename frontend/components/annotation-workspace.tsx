"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useRef } from "react";

import { Panel } from "@/components/panel";
import { PaginationControls } from "@/components/pagination-controls";
import { RangeEditor } from "@/components/range-editor";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/youtube-player";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/time";
import type { AnnotationRange } from "@/lib/types";


type LoadedVideo = { id: string; youtubeVideoId: string; youtubeUrl: string } | null;


export function AnnotationWorkspace({ initialLoadedVideo }: { initialLoadedVideo: LoadedVideo }) {
  const queryClient = useQueryClient();
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState(initialLoadedVideo?.youtubeUrl ?? "");
  const [loadedVideo, setLoadedVideo] = useState<LoadedVideo>(initialLoadedVideo);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [draftOpen, setDraftOpen] = useState(false);
  const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [voicesPage, setVoicesPage] = useState(1);
  const [rangesPage, setRangesPage] = useState(1);

  const voicesQuery = useQuery({
    queryKey: ["voices", "annotation-sidebar", voicesPage],
    queryFn: () => api.listVoices(`?includeArchived=false&page=${voicesPage}&pageSize=8`),
  });

  const emotionsQuery = useQuery({
    queryKey: ["vocabulary", "emotion"],
    queryFn: () => api.listVocabulary("emotion"),
  });

  const rangesQuery = useQuery({
    queryKey: ["video-ranges", loadedVideo?.id, rangesPage],
    queryFn: () => api.getVideoRanges(loadedVideo!.id, `?page=${rangesPage}&pageSize=10`),
    enabled: Boolean(loadedVideo?.id),
  });

  const resolveMutation = useMutation({
    mutationFn: api.resolveVideo,
    onSuccess: (payload) => {
      setLoadedVideo({
        id: payload.id,
        youtubeVideoId: payload.youtube_video_id,
        youtubeUrl: payload.youtube_url,
      });
      setBanner(null);
      setDraftOpen(false);
      setEditingRangeId(null);
      setRangesPage(1);
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.createRange(loadedVideo!.id, payload),
    onSuccess: async () => {
      setDraftOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["video-ranges", loadedVideo?.id] });
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ rangeId, payload }: { rangeId: string; payload: Record<string, unknown> }) => api.updateRange(rangeId, payload),
    onSuccess: async () => {
      setEditingRangeId(null);
      await queryClient.invalidateQueries({ queryKey: ["video-ranges", loadedVideo?.id] });
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteRange,
    onSuccess: async () => {
      setEditingRangeId(null);
      setBanner("Range deleted.");
      await queryClient.invalidateQueries({ queryKey: ["video-ranges", loadedVideo?.id] });
      await queryClient.invalidateQueries({ queryKey: ["voices"] });
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const voices = voicesQuery.data?.items || [];
  const emotions = emotionsQuery.data || [];
  const ranges = rangesQuery.data?.items || [];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <Panel title="Voices" subtitle="Live collection totals stay visible while annotating.">
          <div className="space-y-3">
            {voices.map((voice) => (
              <div key={voice.id} className="rounded-2xl border border-line p-3">
                <div className="font-semibold text-ink">{voice.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {voice.language} / {voice.dialect} / {voice.gender_label}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {formatDuration(voice.total_duration_ms)} total • {voice.range_count} ranges
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Link className="flex-1 rounded-xl bg-accent px-4 py-2 text-center text-sm font-semibold text-white" href="/voices">
                Manage Voices
              </Link>
              <Link className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" href="/vocabularies">
                Vocab
              </Link>
            </div>
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
      </aside>

      <div className="space-y-6">
        <Panel title="Annotation Workspace" subtitle="Load a YouTube video, then capture precise extract ranges.">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
            />
            <button
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white"
              disabled={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate(youtubeUrl)}
              type="button"
            >
              {resolveMutation.isPending ? "Loading..." : "Load"}
            </button>
          </div>
          {banner ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{banner}</div> : null}

          <div className="mt-5">
            <YouTubePlayer
              currentTimeMs={currentTimeMs}
              onCurrentTimeChange={setCurrentTimeMs}
              playerRef={playerRef}
              videoId={loadedVideo?.youtubeVideoId ?? null}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-mist px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Current time</div>
              <div className="text-lg font-semibold">{formatDuration(currentTimeMs)}</div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium" onClick={() => playerRef.current?.play()} type="button">
                Play
              </button>
              <button className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium" onClick={() => playerRef.current?.pause()} type="button">
                Pause
              </button>
              {loadedVideo ? (
                <a
                  className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium"
                  href={loadedVideo.youtubeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open YouTube
                </a>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title="Ranges" subtitle="Inline editing keeps the player visible while you work.">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {loadedVideo ? `${rangesQuery.data?.total_items ?? ranges.length} ranges for current video` : "Load a video to start annotating"}
            </div>
            <button
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
              disabled={!loadedVideo || draftOpen}
              onClick={() => setDraftOpen(true)}
              type="button"
            >
              Add Range
            </button>
          </div>

          {draftOpen ? (
            <RangeEditor
              currentTimeMs={currentTimeMs}
              emotions={emotions}
              onCancel={() => setDraftOpen(false)}
              onSave={async (payload) => {
                await createMutation.mutateAsync(payload);
              }}
              voices={voices}
            />
          ) : null}

          <div className="mt-4 space-y-3">
            {ranges.map((range) =>
              editingRangeId === range.id ? (
                <RangeEditor
                  key={range.id}
                  currentTimeMs={currentTimeMs}
                  emotions={emotions}
                  onCancel={() => setEditingRangeId(null)}
                  onDelete={async () => {
                    await deleteMutation.mutateAsync(range.id);
                  }}
                  onSave={async (payload) => {
                    await updateMutation.mutateAsync({ rangeId: range.id, payload });
                  }}
                  range={range}
                  voices={voices}
                />
              ) : (
                <RangeRow key={range.id} range={range} onEdit={() => setEditingRangeId(range.id)} onSeek={() => playerRef.current?.seekToMs(range.start_ms)} />
              ),
            )}
          </div>
          {rangesQuery.data ? (
            <PaginationControls
              page={rangesQuery.data.page}
              pageSize={rangesQuery.data.page_size}
              totalItems={rangesQuery.data.total_items}
              totalPages={rangesQuery.data.total_pages}
              onPageChange={setRangesPage}
            />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}


function RangeRow({ range, onEdit, onSeek }: { range: AnnotationRange; onEdit: () => void; onSeek: () => void }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="rounded-xl bg-mist px-3 py-2 text-sm font-semibold text-slate-600">{formatDuration(range.duration_ms)}</div>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">{formatDuration(range.start_ms)}</span>
          <span className="text-slate-400">to</span>
          <span className="font-semibold">{formatDuration(range.end_ms)}</span>
          <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium">{range.voice_name}</span>
          {range.emotion_label ? <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium">{range.emotion_label}</span> : null}
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {range.transcription ? range.transcription : "No transcription yet"}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium" onClick={onSeek} type="button">
          Seek
        </button>
        <button className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white" onClick={onEdit} type="button">
          Edit
        </button>
      </div>
    </div>
  );
}
