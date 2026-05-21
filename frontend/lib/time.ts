export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const milliseconds = safe % 1000;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const [, h, m, s, ms = "0"] = match;
  return Number(h) * 3_600_000 + Number(m) * 60_000 + Number(s) * 1000 + Number(ms.padEnd(3, "0"));
}

