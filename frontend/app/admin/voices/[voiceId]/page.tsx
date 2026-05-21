"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/time";


export default function AdminVoiceDetailPage() {
  const params = useParams<{ voiceId: string }>();
  const voiceId = params.voiceId;
  const detailQuery = useQuery({
    queryKey: ["admin-voice-detail", voiceId],
    queryFn: () => api.adminVoiceDetail(voiceId),
    enabled: Boolean(voiceId),
  });
  const rangesQuery = useQuery({
    queryKey: ["admin-voice-ranges", voiceId],
    queryFn: () => api.adminVoiceRanges(voiceId),
    enabled: Boolean(voiceId),
  });

  const detail = detailQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin Detail</div>
          <h1 className="text-3xl font-semibold text-ink">{detail?.voice.name ?? "Loading..."}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {detail?.voice.language} / {detail?.voice.dialect} / {detail?.voice.gender_label}
          </p>
        </div>
        <Link className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" href="/admin/voices">
          Back to list
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total ranges" value={String(detail?.stats.range_count ?? 0)} />
        <MetricCard label="Total duration" value={formatDuration(detail?.stats.total_duration_ms ?? 0)} />
        <MetricCard label="Average duration" value={formatDuration(detail?.stats.average_duration_ms ?? 0)} />
        <MetricCard label="Transcript coverage" value={`${detail?.stats.with_transcription_count ?? 0} with`} />
      </div>

      <Panel title="Emotion breakdown">
        <div className="flex flex-wrap gap-3">
          {Object.entries(detail?.stats.emotion_counts || {}).map(([label, count]) => (
            <div key={label} className="rounded-2xl border border-line bg-mist px-4 py-3 text-sm">
              <div className="font-semibold">{label}</div>
              <div className="text-slate-500">{count} ranges</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Collected ranges" subtitle="Separate admin screen for one-voice review and basic operational stats.">
        <div className="overflow-hidden rounded-2xl border border-line">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Transcript</th>
                <th>Emotion</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {rangesQuery.data?.items.map((range) => (
                <tr key={range.id}>
                  <td>{range.youtube_video_id}</td>
                  <td>{formatDuration(range.start_ms)}</td>
                  <td>{formatDuration(range.end_ms)}</td>
                  <td>{formatDuration(range.duration_ms)}</td>
                  <td>{range.transcription ? "Yes" : "No"}</td>
                  <td>{range.emotion_label || "—"}</td>
                  <td>{range.note ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}


function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
