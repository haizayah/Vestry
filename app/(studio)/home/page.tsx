import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/activity-list";
import { AssignmentStatusChip } from "@/components/assignment-response";
import { ConflictChip } from "@/components/conflict-chip";
import { PendingRequests } from "@/components/pending-requests";
import { ReminderChip } from "@/components/reminder-chip";
import { ReminderToggle } from "@/components/reminder-toggle";
import { visibleActivity } from "@/lib/activity";
import { getSession } from "@/lib/auth";
import { firstName, formatShortDate, timeGreeting } from "@/lib/format";
import { listLockoutsForConflictRead } from "@/lib/lockout-api";
import { enabledModuleChips, hasModule, ORG_TYPE_LABELS } from "@/lib/modules";
import { reminderRows } from "@/lib/reminders";
import { nextDaysPeek, pendingRequestRows, scheduleRows } from "@/lib/schedule";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const worshipOn = hasModule(store.modules, "worship");
  const eventsOn = hasModule(store.modules, "events");
  const lockouts = await listLockoutsForConflictRead();
  const person = store.people.find((entry) => entry.userId === session.id);
  const listArgs = {
    events: eventsOn ? store.events : [],
    plans: store.plans,
    people: store.people,
    lockouts,
    includePlans: worshipOn,
  };
  const pending = pendingRequestRows({
    ...listArgs,
    personId: person?.id,
    onlyMine: session.role !== "director",
  });
  const reminders = reminderRows(scheduleRows(listArgs)).filter((row) =>
    session.role === "director" ? true : row.assignment.personId === person?.id,
  );
  const conflictRows = scheduleRows(listArgs).filter((row) => {
    if (row.conflicts.length === 0) return false;
    return session.role === "director" ? true : row.assignment.personId === person?.id;
  });
  const conflictSeen = new Set<string>();
  const uniqueConflicts = conflictRows.filter((row) => {
    const key = `${row.href}:${row.date}:${row.assignment.personId}`;
    if (conflictSeen.has(key)) return false;
    conflictSeen.add(key);
    return true;
  });
  const peek = nextDaysPeek({
    ...listArgs,
    songs: store.songs,
    includeEvents: eventsOn,
    personId: person?.id,
  });
  const feed = visibleActivity(store.activity, store.modules).slice(0, 8);
  const awaitingCount = pending.length;
  const needsCount = pending.length + uniqueConflicts.length + reminders.length;
  const quickCreateHref = worshipOn ? "/plans/new" : eventsOn ? "/calendar?new=event" : null;
  const chips = enabledModuleChips(store.modules);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl tracking-tight text-ink md:text-5xl">
            {timeGreeting()}, {firstName(session.name)}
          </h1>
          <p className="mt-3 text-ink-soft">
            {store.churchName} · {ORG_TYPE_LABELS[store.orgType]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip.id} className="chip chip-active">
                {chip.label}
              </span>
            ))}
          </div>
        </div>
        {session.role === "director" && quickCreateHref ? (
          <Link href={quickCreateHref} className="btn btn-primary">
            Quick create
          </Link>
        ) : null}
      </div>

      {needsCount > 0 ? (
        <section className="mt-10 space-y-8">
          <div>
            <p className="field-label">Now</p>
            <h2 className="font-serif text-3xl tracking-tight text-ink">Needs attention</h2>
          </div>

          {pending.length > 0 ? (
            <PendingRequests
              rows={pending}
              viewerPersonId={person?.id}
              isDirector={session.role === "director"}
              title="Schedule requests"
              compact
            />
          ) : null}

          {uniqueConflicts.length > 0 ? (
            <div>
              <p className="field-label">Warn-only</p>
              <h3 className="font-serif text-2xl tracking-tight text-ink">Conflicts</h3>
              <ul className="mt-4 space-y-3">
                {uniqueConflicts.map((row) => (
                  <li key={`conflict-${row.key}`} className="paper-card rounded-3xl px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={row.href} className="font-serif text-xl text-ink underline-offset-4 hover:underline">
                          {row.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {row.personName} · {row.assignment.position} · {formatShortDate(row.date)} · {row.time}
                        </p>
                      </div>
                      <ConflictChip
                        tooltip={row.conflicts
                          .map((conflict) =>
                            conflict.note
                              ? `${conflict.personName}: ${conflict.range} — ${conflict.note}`
                              : `${conflict.personName}: ${conflict.range}`,
                          )
                          .join(" · ")}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {reminders.length > 0 ? (
            <div>
              <p className="field-label">In-app</p>
              <h3 className="font-serif text-2xl tracking-tight text-ink">Reminders</h3>
              <ul className="mt-4 space-y-3">
                {reminders.map((row) => (
                  <li key={`remind-${row.key}`} className="paper-card rounded-3xl px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={row.href} className="font-serif text-xl text-ink underline-offset-4 hover:underline">
                          {row.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          {row.personName} · {row.assignment.position} · {formatShortDate(row.date)} · {row.time}
                        </p>
                      </div>
                      <ReminderChip />
                    </div>
                    <div className="mt-3">
                      <ReminderToggle
                        assignmentId={row.assignment.id}
                        reminder={row.assignment.reminder}
                        planId={row.planId}
                        eventId={row.eventId}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className={`${needsCount > 0 ? "mt-10" : "mt-8"} grid gap-4 sm:grid-cols-2`}>
        <article className="paper-card rounded-3xl p-6">
          <p className="field-label">This week</p>
          <p className="font-serif text-4xl tracking-tight">{peek.length}</p>
          <p className="mt-2 text-sm text-muted">
            {worshipOn && eventsOn
              ? "Plans and events in the next 7 days"
              : worshipOn
                ? "Plans in the next 7 days"
                : eventsOn
                  ? "Events in the next 7 days"
                  : "Nothing module-backed this week"}
          </p>
        </article>
        <article className="paper-card rounded-3xl p-6">
          <p className="field-label">{session.role === "director" ? "Awaiting replies" : "Your pending"}</p>
          <p className="font-serif text-4xl tracking-tight">{awaitingCount}</p>
        </article>
      </div>

      <section className="mt-12">
        <p className="field-label">Schedule</p>
        <h2 className="font-serif text-3xl tracking-tight text-ink">Next 7 days</h2>
        <div className="mt-5 grid gap-4">
          {peek.map((item) => (
            <Link key={item.key} href={item.href} className="paper-card block rounded-3xl p-6 transition hover:-translate-y-0.5">
              <p className="text-sm text-muted">
                {formatShortDate(item.date)} · {item.time}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-2xl tracking-tight text-ink">{item.title}</h3>
                <span className="chip">{item.kind === "plan" ? "Plan" : "Event"}</span>
                {item.conflicts.length > 0 ? (
                  <ConflictChip
                    tooltip={item.conflicts
                      .map((conflict) =>
                        conflict.note
                          ? `${conflict.personName}: ${conflict.range} — ${conflict.note}`
                          : `${conflict.personName}: ${conflict.range}`,
                      )
                      .join(" · ")}
                  />
                ) : null}
              </div>
              {item.kind === "plan" && worshipOn ? (
                <p className="mt-1 text-sm text-ink-soft">
                  {item.itemCount} {item.itemCount === 1 ? "item" : "items"} in the order
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.kind === "plan" && worshipOn && item.media ? (
                  <span className="chip">
                    Media {item.media.ready}/{item.media.total || 0}
                  </span>
                ) : null}
                <span className="chip">
                  Assigned {item.assignedAccepted}/{item.assignedTotal}
                </span>
                {item.myAssignment ? <AssignmentStatusChip status={item.myAssignment.status} /> : null}
                {item.myAssignment ? <span className="chip">{item.myAssignment.position}</span> : null}
              </div>
            </Link>
          ))}
          {peek.length === 0 ? (
            <div className="paper-card rounded-3xl p-8 text-muted">Nothing scheduled in the next 7 days.</div>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="field-label">Org</p>
            <h2 className="font-serif text-3xl tracking-tight text-ink">Activity</h2>
          </div>
          <Link href="/activity" className="text-sm text-accent underline-offset-4 hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-4">
          <ActivityList items={feed} empty="Nothing new yet. Assignments, replies, and new events will land here." />
        </div>
      </section>
    </div>
  );
}
