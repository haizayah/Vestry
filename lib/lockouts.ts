import { formatShortDate } from "./format";
import type { Lockout, Person, Plan } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function lockoutCoversDate(lockout: Pick<Lockout, "start" | "end">, iso: string): boolean {
  return iso >= lockout.start && iso <= lockout.end;
}

export function lockoutsForPersonOnDate(lockouts: Lockout[], personId: string, iso: string): Lockout[] {
  return lockouts.filter((lockout) => lockout.personId === personId && lockoutCoversDate(lockout, iso));
}

export function formatLockoutRange(start: string, end: string): string {
  if (start === end) return formatShortDate(start);
  return `${formatShortDate(start)}–${formatShortDate(end)}`;
}

export function lockoutTooltip(lockouts: Lockout[]): string {
  return lockouts
    .map((lockout) => {
      const range = formatLockoutRange(lockout.start, lockout.end);
      return lockout.note ? `${range} — ${lockout.note}` : range;
    })
    .join(" · ");
}

export type PlanConflict = {
  personId: string;
  personName: string;
  range: string;
  note: string;
};

export function conflictsForPlan(plan: Plan, lockouts: Lockout[], people: Person[]): PlanConflict[] {
  const seen = new Set<string>();
  const conflicts: PlanConflict[] = [];
  for (const assignment of plan.assignments) {
    for (const lockout of lockoutsForPersonOnDate(lockouts, assignment.personId, plan.date)) {
      const key = `${assignment.personId}:${lockout.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      conflicts.push({
        personId: assignment.personId,
        personName: people.find((person) => person.id === assignment.personId)?.name ?? "Someone",
        range: formatLockoutRange(lockout.start, lockout.end),
        note: lockout.note,
      });
    }
  }
  return conflicts;
}
