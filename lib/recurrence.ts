import { addDaysISO, addMonthsISO, dateFromISO, startOfWeekISO } from "./calendar";
import type { Event, RecurrenceRule, RepeatFreq } from "./types";

export type EventOccurrence = {
  eventId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  index: number;
  assignments: Event["assignments"];
};

const MAX_OCCURRENCES = 104;

export function parseRepeatFreq(value: string): RepeatFreq {
  if (value === "weekly" || value === "biweekly" || value === "monthly" || value === "none") return value;
  return "none";
}

export function parseWeekdays(values: string[]): number[] {
  const days = values
    .map((value) => Number(value))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

export function parseRecurrenceFromForm(formData: FormData): RecurrenceRule | null {
  const freq = parseRepeatFreq(String(formData.get("repeat") || "none"));
  if (freq === "none") return null;

  const interval = Math.max(1, Math.min(12, Number(formData.get("interval") || 1) || 1));
  const weekdays = parseWeekdays(formData.getAll("weekday").map(String));
  const endsMode = String(formData.get("endsMode") || "count");
  const start = String(formData.get("date") || "");

  if (endsMode === "until") {
    const until = String(formData.get("endsOn") || "");
    return {
      freq,
      interval,
      weekdays: weekdays.length ? weekdays : start ? [dateFromISO(start).getDay()] : [],
      ends: { mode: "until", until: until || start },
    };
  }

  const count = Math.max(1, Math.min(MAX_OCCURRENCES, Number(formData.get("endsCount") || 12) || 12));
  return {
    freq,
    interval,
    weekdays: weekdays.length ? weekdays : start ? [dateFromISO(start).getDay()] : [],
    ends: { mode: "count", count },
  };
}

export function recurrenceSummary(rule: RecurrenceRule | null): string {
  if (!rule) return "Does not repeat";
  const interval = rule.interval > 1 ? `every ${rule.interval} ` : "";
  const freq =
    rule.freq === "weekly"
      ? `${interval}${rule.interval > 1 ? "weeks" : "week"}`
      : rule.freq === "biweekly"
        ? `${rule.interval > 1 ? `every ${rule.interval * 2} weeks` : "every 2 weeks"}`
        : `${interval}${rule.interval > 1 ? "months" : "month"}`;
  const ends = rule.ends.mode === "count" ? `after ${rule.ends.count} occurrences` : `until ${rule.ends.until}`;
  return `${rule.freq === "biweekly" ? "Biweekly" : rule.freq === "monthly" ? "Monthly" : "Weekly"} · ${freq} · ${ends}`;
}

export function expandOccurrences(event: Event, horizonISO?: string): EventOccurrence[] {
  const base = {
    eventId: event.id,
    title: event.title,
    time: event.time,
    location: event.location,
    notes: event.notes,
    assignments: event.assignments,
  };

  if (!event.recurrence) {
    return [{ ...base, date: event.date, index: 0 }];
  }

  const dates = expandDates(event.date, event.recurrence, horizonISO);
  return dates.map((date, index) => ({ ...base, date, index }));
}

function expandDates(start: string, rule: RecurrenceRule, horizonISO?: string): string[] {
  const max = rule.ends.mode === "count" ? Math.min(rule.ends.count, MAX_OCCURRENCES) : MAX_OCCURRENCES;
  const until = rule.ends.mode === "until" ? rule.ends.until : (horizonISO ?? addMonthsISO(start, 24));
  const dates: string[] = [];

  if (rule.freq === "monthly") {
    let cursor = start;
    while (dates.length < max && cursor <= until) {
      dates.push(cursor);
      cursor = addMonthsISO(cursor, rule.interval || 1);
    }
    return dates;
  }

  const stepWeeks = (rule.freq === "biweekly" ? 2 : 1) * (rule.interval || 1);
  const weekdays = rule.weekdays.length ? rule.weekdays : [dateFromISO(start).getDay()];
  let weekStart = startOfWeekISO(start);
  let guard = 0;

  while (dates.length < max && guard < 400) {
    for (const weekday of weekdays) {
      const iso = addDaysISO(weekStart, weekday);
      if (iso < start) continue;
      if (iso > until) return dates;
      dates.push(iso);
      if (dates.length >= max) return dates;
    }
    weekStart = addDaysISO(weekStart, stepWeeks * 7);
    guard += 1;
  }

  return dates;
}

export function nextOccurrence(event: Event, today: string): EventOccurrence | null {
  return expandOccurrences(event).find((row) => row.date >= today) ?? null;
}
