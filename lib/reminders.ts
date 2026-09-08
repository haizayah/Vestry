import { addDaysISO } from "./calendar";
import { todayISO } from "./format";
import type { ScheduleRow } from "./schedule";

const REMINDER_WINDOW_DAYS = 14;

export function reminderRows(rows: ScheduleRow[]): ScheduleRow[] {
  const today = todayISO();
  const until = addDaysISO(today, REMINDER_WINDOW_DAYS);
  return rows.filter((row) => {
    if (row.assignment.status === "declined") return false;
    if (row.date < today || row.date > until) return false;
    return Boolean(row.assignment.reminder);
  });
}

export function assignmentNeedsReminder(reminder: boolean | undefined, date: string, status: string): boolean {
  if (!reminder || status === "declined") return false;
  const today = todayISO();
  return date >= today && date <= addDaysISO(today, REMINDER_WINDOW_DAYS);
}
