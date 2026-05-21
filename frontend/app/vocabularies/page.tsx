"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";
import type { VocabularyEntry } from "@/lib/types";


const tabs: Array<"gender" | "emotion"> = ["gender", "emotion"];


export default function VocabulariesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"gender" | "emotion">("gender");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  const entriesQuery = useQuery({
    queryKey: ["vocabulary", tab],
    queryFn: () => api.listVocabulary(tab),
  });

  const selectedEntry = useMemo(
    () => entriesQuery.data?.find((entry) => entry.id === selectedId) || null,
    [entriesQuery.data, selectedId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (selectedId) {
        return api.updateVocabulary(tab, selectedId, { value, is_active: isActive });
      }
      return api.createVocabulary(tab, { value, is_active: isActive });
    },
    onSuccess: async (entry) => {
      setSelectedId(entry.id);
      setBanner("Vocabulary saved.");
      await queryClient.invalidateQueries({ queryKey: ["vocabulary", tab] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteVocabulary(tab, selectedId!),
    onSuccess: async () => {
      setSelectedId(null);
      setValue("");
      setIsActive(true);
      setBanner("Vocabulary deleted.");
      await queryClient.invalidateQueries({ queryKey: ["vocabulary", tab] });
    },
    onError: (error: Error) => setBanner(error.message),
  });

  function selectEntry(entry: VocabularyEntry) {
    setSelectedId(entry.id);
    setValue(entry.value);
    setIsActive(entry.is_active);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Panel title="Controlled Vocabularies" subtitle="Keep speaker metadata consistent while protecting historical ranges.">
        <div className="mb-4 flex gap-2 rounded-2xl bg-mist p-1">
          {tabs.map((item) => (
            <button
              key={item}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${tab === item ? "bg-accent text-white" : "text-slate-600"}`}
              onClick={() => {
                setTab(item);
                setSelectedId(null);
                setValue("");
                setIsActive(true);
              }}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="mb-4 w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            setSelectedId(null);
            setValue("");
            setIsActive(true);
          }}
          type="button"
        >
          New Entry
        </button>
        <div className="space-y-3">
          {entriesQuery.data?.map((entry) => (
            <button
              key={entry.id}
              className={`w-full rounded-2xl border p-3 text-left ${selectedId === entry.id ? "border-accent bg-mist" : "border-line bg-white"}`}
              onClick={() => selectEntry(entry)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{entry.value}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${entry.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {entry.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">{entry.usage_count} in use</div>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={selectedId ? "Edit Entry" : "Create Entry"} subtitle="Set entries inactive instead of deleting when they are already in use.">
        {banner ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{banner}</div> : null}
        <Field label="Value">
          <input value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
          Active values appear in forms for new records.
        </label>

        {selectedEntry ? (
          <div className="mt-4 rounded-2xl border border-line bg-mist p-4 text-sm text-slate-600">
            Usage count: {selectedEntry.usage_count}
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white" onClick={() => saveMutation.mutate()} type="button">
            {selectedId ? "Save Entry" : "Create Entry"}
          </button>
          {selectedId ? (
            <button className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => deleteMutation.mutate()} type="button">
              Delete Entry
            </button>
          ) : null}
        </div>
      </Panel>
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

