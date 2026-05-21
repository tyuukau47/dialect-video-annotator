"use client";

import { useMemo, useState } from "react";

import { formatDuration, parseDuration } from "@/lib/time";
import type { AnnotationRange, VocabularyEntry, Voice } from "@/lib/types";


type RangePayload = {
  startMs: number;
  endMs: number;
  voiceId: string;
  transcription: string | null;
  emotionId: string | null;
  note: string | null;
};


export function RangeEditor({
  range,
  voices,
  emotions,
  currentTimeMs,
  onSave,
  onCancel,
  onDelete,
}: {
  range?: AnnotationRange;
  voices: Voice[];
  emotions: VocabularyEntry[];
  currentTimeMs: number;
  onSave: (payload: RangePayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [startText, setStartText] = useState(formatDuration(range?.start_ms ?? currentTimeMs));
  const [endText, setEndText] = useState(formatDuration(range?.end_ms ?? currentTimeMs + 1000));
  const [voiceId, setVoiceId] = useState(range?.voice_id ?? voices[0]?.id ?? "");
  const [emotionId, setEmotionId] = useState(range?.emotion_vocab_id ?? "");
  const [transcription, setTranscription] = useState(range?.transcription ?? "");
  const [note, setNote] = useState(range?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const durationPreview = useMemo(() => {
    const startMs = parseDuration(startText);
    const endMs = parseDuration(endText);
    if (startMs === null || endMs === null || endMs <= startMs) return null;
    return endMs - startMs;
  }, [endText, startText]);

  async function handleSubmit() {
    const startMs = parseDuration(startText);
    const endMs = parseDuration(endText);
    if (startMs === null || endMs === null) {
      setError("Use HH:MM:SS.mmm format.");
      return;
    }
    if (endMs <= startMs) {
      setError("Start time must be earlier than end time.");
      return;
    }
    if (!voiceId) {
      setError("Choose a voice before saving.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({
        startMs,
        endMs,
        voiceId,
        transcription: transcription || null,
        emotionId: emotionId || null,
        note: note || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-sand/40 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Start</label>
          <input value={startText} onChange={(event) => setStartText(event.target.value)} />
        </div>
        <div className="pt-6">
          <button
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium"
            onClick={() => setStartText(formatDuration(currentTimeMs))}
            type="button"
          >
            Set Start
          </button>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">End</label>
          <input value={endText} onChange={(event) => setEndText(event.target.value)} />
        </div>
        <div className="pt-6">
          <button
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium"
            onClick={() => setEndText(formatDuration(currentTimeMs))}
            type="button"
          >
            Set End
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Voice</label>
          <select value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
            <option value="">Select voice</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} • {voice.dialect}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Emotion</label>
          <select value={emotionId} onChange={(event) => setEmotionId(event.target.value)}>
            <option value="">Optional</option>
            {emotions
              .filter((entry) => entry.is_active)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.value}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Transcription</label>
        <textarea rows={3} value={transcription} onChange={(event) => setTranscription(event.target.value)} />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Note</label>
        <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {durationPreview !== null ? `Duration ${formatDuration(durationPreview)}` : "Set a valid range to preview duration"}
        </div>
        <div className="flex gap-2">
          {onDelete ? (
            <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600" onClick={onDelete} type="button">
              Delete
            </button>
          ) : null}
          <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white" disabled={saving} onClick={handleSubmit} type="button">
            {saving ? "Saving..." : "Save Range"}
          </button>
        </div>
      </div>
      {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}
    </div>
  );
}

