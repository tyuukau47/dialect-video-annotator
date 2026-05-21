"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/time";


export default function AdminVoicesPage() {
  const [search, setSearch] = useState("");
  const queryString = useMemo(() => (search ? `?q=${encodeURIComponent(search)}` : ""), [search]);
  const voicesQuery = useQuery({
    queryKey: ["admin-voices", queryString],
    queryFn: () => api.adminVoices(queryString),
  });

  return (
    <Panel title="Admin Voice Review" subtitle="Select a voice to inspect all collected ranges and quick statistics.">
      <div className="mb-4">
        <input placeholder="Search by name, language, or dialect" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <table>
          <thead>
            <tr>
              <th>Voice</th>
              <th>Language</th>
              <th>Dialect</th>
              <th>Gender</th>
              <th>Ranges</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {voicesQuery.data?.items.map((voice) => (
              <tr key={voice.id}>
                <td className="font-semibold">{voice.name}</td>
                <td>{voice.language}</td>
                <td>{voice.dialect}</td>
                <td>{voice.genderLabel}</td>
                <td>{voice.rangeCount}</td>
                <td>{formatDuration(voice.totalDurationMs)}</td>
                <td>
                  <Link className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white" href={`/admin/voices/${voice.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

