import { todayISO } from "./format";
import { conflictsForAssignments, type PlanConflict } from "./lockouts";
import { expandOccurrences, type EventOccurrence } from "./recurrence";
import type { Assignment, Event, Lockout, Person, Plan } from "./types";

export type ScheduleRow = {
  key: string;
  kind: "event" | "plan";
  href: string;
  planId?: string;
  eventId?: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  assignment: Assignment;
  personName: string;
  conflicts: PlanConflict[];
};

export function scheduleRows({
  events,
  plans,
  people,
  lockouts,
  includePlans,
}: {
  events: Event[];
  plans: Plan[];
  people: Person[];
  lockouts: Lockout[];
  includePlans: boolean;
}): ScheduleRow[] {
  const today = todayISO();
  const rows: ScheduleRow[] = [];

  for (const event of events) {
    const next = expandOccurrences(event).find((occurrence) => occurrence.date >= today);
    if (next) pushAssignments(rows, event, next, people, lockouts);
  }

  if (includePlans) {
    for (const plan of plans.filter((entry) => entry.date >= today)) {
      for (const assignment of plan.assignments) {
        rows.push({
          key: `${plan.id}:${assignment.id}`,
          kind: "plan",
          href: `/plans/${plan.id}`,
          planId: plan.id,
          title: plan.name,
          date: plan.date,
          time: plan.serviceTime,
          assignment,
          personName: people.find((person) => person.id === assignment.personId)?.name ?? "Someone",
          conflicts: conflictsForAssignments([assignment], plan.date, lockouts, people),
        });
      }
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function pendingRequestRows(
  args: Parameters<typeof scheduleRows>[0] & { personId?: string; onlyMine?: boolean },
): ScheduleRow[] {
  const rows = scheduleRows(args).filter((row) => row.assignment.status === "pending");
  if (args.onlyMine) {
    return rows.filter((row) => row.assignment.personId === args.personId);
  }
  return rows;
}

function pushAssignments(
  rows: ScheduleRow[],
  event: Event,
  occurrence: EventOccurrence,
  people: Person[],
  lockouts: Lockout[],
) {
  for (const assignment of event.assignments) {
    rows.push({
      key: `${event.id}:${occurrence.date}:${assignment.id}`,
      kind: "event",
      href: `/events/${event.id}`,
      eventId: event.id,
      title: event.title,
      date: occurrence.date,
      time: event.time,
      location: event.location,
      assignment,
      personName: people.find((person) => person.id === assignment.personId)?.name ?? "Someone",
      conflicts: conflictsForAssignments([assignment], occurrence.date, lockouts, people),
    });
  }
}
