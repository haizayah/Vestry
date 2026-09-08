export type CalendarConflict = {
  personName: string;
  range: string;
  note: string;
};

export type CalendarPlan = {
  id: string;
  name: string;
  date: string;
  serviceTime: string;
  assigned: boolean;
  conflicts: CalendarConflict[];
};

/** Optional church-event chips. P0 wires the UI; the store may pass none. */
export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  href?: string;
  assigned?: boolean;
  conflicts?: CalendarConflict[];
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_NARROW = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const WEEK_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

export function isoFromParts(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function dateFromISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDaysISO(iso: string, days: number): string {
  const date = dateFromISO(iso);
  date.setDate(date.getDate() + days);
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addMonthsISO(iso: string, months: number): string {
  const date = dateFromISO(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeekISO(iso: string): string {
  const date = dateFromISO(iso);
  date.setDate(date.getDate() - date.getDay());
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

export function monthGrid(iso: string): string[] {
  const date = dateFromISO(iso);
  const first = isoFromParts(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeekISO(first);
  return Array.from({ length: 42 }, (_, i) => addDaysISO(start, i));
}

export function weekDays(iso: string): string[] {
  const start = startOfWeekISO(iso);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
}

export function sameMonth(iso: string, cursor: string): boolean {
  return iso.slice(0, 7) === cursor.slice(0, 7);
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMonthTitle(iso: string): string {
  const date = dateFromISO(iso);
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekTitle(iso: string): string {
  const days = weekDays(iso);
  const start = dateFromISO(days[0]);
  const end = dateFromISO(days[6]);
  const startMonth = MONTHS_SHORT[start.getMonth()];
  const endMonth = MONTHS_SHORT[end.getMonth()];
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}, ${year}`;
}

export function parseServiceHour(serviceTime: string): number | null {
  const match = serviceTime.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}
