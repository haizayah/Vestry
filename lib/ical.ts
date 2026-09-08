import { parseServiceHour } from "./calendar";
import { hasModule } from "./modules";
import { expandOccurrences } from "./recurrence";
import type { StoreData } from "./types";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function icsDate(iso: string, time: string): string {
  const [year, month, day] = iso.split("-");
  const hour = parseServiceHour(time) ?? 10;
  const minuteMatch = time.trim().match(/:(\d{2})/);
  const minute = minuteMatch ? Number(minuteMatch[1]) : 0;
  return `${year}${month}${day}T${pad(hour)}${pad(Number.isFinite(minute) ? minute : 0)}00`;
}

function icsStamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let cursor = 0;
  while (cursor < line.length) {
    const size = cursor === 0 ? 75 : 74;
    parts.push((cursor === 0 ? "" : " ") + line.slice(cursor, cursor + size));
    cursor += size;
  }
  return parts.join("\r\n");
}

function vevent(input: {
  uid: string;
  stamp: string;
  start: string;
  summary: string;
  description?: string;
  location?: string;
}): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${input.stamp}`,
    `DTSTART:${input.start}`,
    `SUMMARY:${escapeText(input.summary)}`,
  ];
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  lines.push("END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

export function buildOrgCalendar(store: StoreData, now = new Date()): string {
  const stamp = icsStamp(now.toISOString());
  const events = store.events.flatMap((event) =>
    expandOccurrences(event).map((occurrence) =>
      vevent({
        uid: `${event.id}-${occurrence.date}@vestry`,
        stamp,
        start: icsDate(occurrence.date, occurrence.time),
        summary: occurrence.title,
        description: occurrence.notes,
        location: occurrence.location,
      }),
    ),
  );

  const plans = hasModule(store.modules, "worship")
    ? store.plans.map((plan) =>
        vevent({
          uid: `${plan.id}@vestry`,
          stamp,
          start: icsDate(plan.date, plan.serviceTime),
          summary: plan.name,
          description: plan.notes,
        }),
      )
    : [];

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vestry//Org calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(store.churchName)}`,
    ...events,
    ...plans,
    "END:VCALENDAR",
  ];

  return `${body.join("\r\n")}\r\n`;
}

export function icalFeedPath(token: string): string {
  return `/api/ical/${encodeURIComponent(token)}`;
}

export function icalFilename(orgName: string): string {
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "vestry"}.ics`;
}
