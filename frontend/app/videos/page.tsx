"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/time";


export default function VideosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const queryString = useMemo(() => (search ? `?q=${encodeURIComponent(search)}` : ""), [search]);
  const videosQuery = useQuery({
    queryKey: ["videos", queryString],
    queryFn: () => api.listVideos(queryString),
  });

  const resolveMutation = useMutation({
    mutationFn: api.resolveVideo,
    onSuccess: async () => {
      setNewUrl("");
      setBanner("Video added.");
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteVideo,
    onSuccess: async () => {
      setBanner("Video deleted.");
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  return (
    <div className="space-y-6">
      <Panel title="Videos" subtitle="Register videos once, then jump into annotation or review collection coverage.">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            placeholder="https://www.youtube.com/watch?v=..."
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
          />
          <button
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate(newUrl)}
            type="button"
          >
            {resolveMutation.isPending ? "Adding..." : "Add Video"}
          </button>
        </div>
        {banner ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{banner}</div> : null}
      </Panel>

      <Panel title="Video Library" subtitle="Delete is blocked while active ranges still reference a video.">
        <div className="mb-4">
          <input placeholder="Search by URL or video ID" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="overflow-hidden rounded-2xl border border-line">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>YouTube ID</th>
                <th>Ranges</th>
                <th>Total duration</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {videosQuery.data?.items.map((video) => (
                <tr key={video.id}>
                  <td>
                    <div className="max-w-xl truncate font-medium text-ink">{video.source_url}</div>
                  </td>
                  <td className="font-mono text-xs text-slate-500">{video.youtube_video_id}</td>
                  <td>{video.range_count}</td>
                  <td>{formatDuration(video.total_duration_ms)}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        className="rounded-xl border border-line px-3 py-2 text-sm font-medium"
                        href={`/annotation?videoId=${encodeURIComponent(video.id)}&youtubeVideoId=${encodeURIComponent(video.youtube_video_id)}&youtubeUrl=${encodeURIComponent(video.source_url)}`}
                      >
                        Annotate
                      </Link>
                      <a
                        className="rounded-xl border border-line px-3 py-2 text-sm font-medium"
                        href={video.source_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open
                      </a>
                      <button
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600"
                        onClick={() => deleteMutation.mutate(video.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
