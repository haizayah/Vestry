import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignmentStatusChip } from "@/components/assignment-response";
import { ConflictChip } from "@/components/conflict-chip";
import { PendingRequests } from "@/components/pending-requests";
import { ReminderChip } from "@/components/reminder-chip";
import { ReminderToggle } from "@/components/reminder-toggle";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { listLockoutsForConflictRead } from "@/lib/lockout-api";
import { hasModule } from "@/lib/modules";
import { assignmentNeedsReminder } from "@/lib/reminders";
import { pendingRequestRows, scheduleRows } from "@/lib/schedule";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const lockouts = await listLockoutsForConflictRead();
  const person = store.people.find((entry) => entry.userId === session.id);
  const listArgs = {
    events: hasModule(store.modules, "events") ? store.events : [],
    plans: store.plans,
    people: store.people,
    lockouts,
    includePlans: hasModule(store.modules, "worship"),
  };
  const rows = scheduleRows(listArgs);
  const pending = pendingRequestRows({
    ...listArgs,
    personId: person?.id,
    onlyMine: session.role !== "director",
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Schedule</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Director assigns; members Accept or Decline. Conflicts stay warn-only (gold chip) — saves never block.
      </p>

      {pending.length > 0 ? (
        <div className="mt-8">
          <PendingRequests
            rows={pending}
            viewerPersonId={person?.id}
            isDirector={session.role === "director"}
            title="Pending requests"
          />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-lg rounded-[1.75rem] border border-dashed border-line px-6 py-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-paper-deep text-wine-deep">
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 rounded bg-wine-deep/70" />
              <span className="h-0.5 w-5 rounded bg-wine-deep/70" />
              <span className="h-0.5 w-5 rounded bg-wine-deep/70" />
            </span>
          </div>
          <h2 className="mt-6 font-serif text-3xl text-wine-deep">No one scheduled yet</h2>
          <p className="mt-3 text-ink-soft">
            Assign people to positions from an event or plan. Members manage their own blockouts under Availability.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/calendar" className="btn btn-primary">
              Open Calendar
            </Link>
            <Link href="/availability" className="btn btn-ghost">
              Manage availability
            </Link>
          </div>
        </div>
      ) : (
        <ul className={`${pending.length > 0 ? "mt-10" : "mt-8"} space-y-3`}>
          {pending.length > 0 ? (
            <li className="px-1">
              <p className="field-label">Everyone scheduled</p>
            </li>
          ) : null}
          {rows.map((row) => (
            <li key={row.key} className="paper-card flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-4">
              <div>
                <Link href={row.href} className="font-serif text-xl text-wine-deep underline-offset-4 hover:underline">
                  {row.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {row.personName} · {row.assignment.position} · {formatShortDate(row.date)} · {row.time}
                  {row.location ? ` · ${row.location}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {row.conflicts.length > 0 ? (
                  <ConflictChip
                    tooltip={row.conflicts
                      .map((conflict) =>
                        conflict.note
                          ? `${conflict.personName}: ${conflict.range} — ${conflict.note}`
                          : `${conflict.personName}: ${conflict.range}`,
                      )
                      .join(" · ")}
                  />
                ) : null}
                {assignmentNeedsReminder(row.assignment.reminder, row.date, row.assignment.status) ? (
                  <ReminderChip />
                ) : null}
                <AssignmentStatusChip status={row.assignment.status} />
                {session.role === "director" || row.assignment.personId === person?.id ? (
                  <ReminderToggle
                    assignmentId={row.assignment.id}
                    reminder={row.assignment.reminder}
                    planId={row.planId}
                    eventId={row.eventId}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
