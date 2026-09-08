import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/activity-list";
import { ConflictChip } from "@/components/conflict-chip";
import { PendingRequests } from "@/components/pending-requests";
import { ReminderChip } from "@/components/reminder-chip";
import { ReminderToggle } from "@/components/reminder-toggle";
import { visibleActivity } from "@/lib/activity";
import { getSession } from "@/lib/auth";
import { firstName, formatShortDate, isUpcoming, timeGreeting, todayISO } from "@/lib/format";
import { listLockoutsForConflictRead } from "@/lib/lockout-api";
import { conflictsForAssignments } from "@/lib/lockouts";
import { mediaReadyCount } from "@/lib/media";
import { hasModule, moduleSummary, ORG_TYPE_LABELS } from "@/lib/modules";
import { nextOccurrence } from "@/lib/recurrence";
import { reminderRows } from "@/lib/reminders";
import { pendingRequestRows, scheduleRows } from "@/lib/schedule";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const tab = (await searchParams).tab === "attention" ? "attention" : "upcoming";
  const store = await readStore();
  const worshipOn = hasModule(store.modules, "worship");
  const eventsOn = hasModule(store.modules, "events");
  const schedulingOn = hasModule(store.modules, "scheduling");
  const lockouts = await listLockoutsForConflictRead();
  const person = store.people.find((entry) => entry.userId === session.id);
  const upcomingPlans = [...store.plans].filter((plan) => isUpcoming(plan.date)).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingEvents = store.events
    .map((event) => nextOccurrence(event, todayISO()))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => a.date.localeCompare(b.date));

  const myPlanAssignments = store.plans.flatMap((plan) =>
    plan.assignments
      .filter((assignment) => assignment.personId === person?.id)
      .map((assignment) => ({ plan, assignment })),
  );
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
  const nextEvent = upcomingEvents[0];
  const nextEventConflicts = nextEvent
    ? conflictsForAssignments(nextEvent.assignments, nextEvent.date, lockouts, store.people)
    : [];
  const feed = visibleActivity(store.activity, store.modules).slice(0, 8);
  const awaitingCount =
    session.role === "director"
      ? pending.length
      : pending.filter((row) => row.assignment.personId === person?.id).length;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">
        {timeGreeting()}, {firstName(session.name)}
      </h1>
      <p className="mt-3 text-ink-soft">
        {store.churchName} · {ORG_TYPE_LABELS[store.orgType]} · {moduleSummary(store.modules)}
      </p>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-2">
          <Link href="/home" className={`chip ${tab === "upcoming" ? "chip-active" : ""}`}>
            Upcoming
          </Link>
          <Link href="/home?tab=attention" className={`chip ${tab === "attention" ? "chip-active" : ""}`}>
            Needs attention{awaitingCount || reminders.length ? ` · ${awaitingCount + reminders.length}` : ""}
          </Link>
        </div>
        {session.role === "director" ? (
          <Link href={eventsOn && !worshipOn ? "/calendar?new=event" : "/plans/new"} className="btn btn-primary">
            Quick create
          </Link>
        ) : null}
      </div>

      {tab === "attention" ? (
        <div className="mt-8 space-y-8">
          {schedulingOn || pending.length > 0 ? (
            <PendingRequests
              rows={pending}
              viewerPersonId={person?.id}
              isDirector={session.role === "director"}
              title="Schedule requests"
              empty="No pending assignments right now."
            />
          ) : null}

          <section>
            <p className="field-label">In-app</p>
            <h2 className="font-serif text-3xl tracking-tight text-wine-deep">Reminders</h2>
            <p className="mt-2 text-ink-soft">Email-less flags on upcoming assignments. No push, no inbox.</p>
            {reminders.length === 0 ? (
              <p className="mt-4 text-ink-soft">No reminder flags in the next two weeks.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {reminders.map((row) => (
                  <li key={`remind-${row.key}`} className="paper-card rounded-3xl px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={row.href} className="font-serif text-xl text-wine-deep underline-offset-4 hover:underline">
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
            )}
          </section>

          <article className="paper-card rounded-3xl p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">Needs attention</p>
            <h2 className="mt-2 font-serif text-3xl text-wine-deep">Warn-only conflicts</h2>
            <p className="mt-3 text-ink-soft">
              {nextEventConflicts.length
                ? nextEventConflicts.map((row) => `${row.personName} · ${row.range}`).join(" · ")
                : "Nothing blocked. Saves never stop for a lockout overlap."}
            </p>
            {nextEventConflicts.length > 0 ? (
              <div className="mt-4">
                <ConflictChip
                  tooltip={nextEventConflicts
                    .map((row) => (row.note ? `${row.personName}: ${row.range} — ${row.note}` : `${row.personName}: ${row.range}`))
                    .join(" · ")}
                />
              </div>
            ) : null}
          </article>
        </div>
      ) : worshipOn ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="paper-card rounded-3xl p-6">
              <p className="field-label">Upcoming plans</p>
              <p className="font-serif text-4xl tracking-tight">{upcomingPlans.length}</p>
            </article>
            <article className="paper-card rounded-3xl p-6">
              <p className="field-label">Songs in library</p>
              <p className="font-serif text-4xl tracking-tight">{store.songs.length}</p>
            </article>
            <article className="paper-card rounded-3xl p-6">
              <p className="field-label">{session.role === "director" ? "Awaiting replies" : "Your pending"}</p>
              <p className="font-serif text-4xl tracking-tight">{awaitingCount}</p>
            </article>
          </div>

          <div className="mt-10">
            <p className="field-label">This season</p>
            <h2 className="font-serif text-3xl tracking-tight">Upcoming Sundays</h2>
          </div>

          <div className="mt-5 grid gap-4">
            {upcomingPlans.map((plan) => {
              const ready = mediaReadyCount(plan, store.songs);
              return (
                <Link key={plan.id} href={`/plans/${plan.id}`} className="paper-card block rounded-3xl p-6 transition hover:-translate-y-0.5">
                  <p className="text-sm text-muted">
                    {formatShortDate(plan.date)} · {plan.serviceTime}
                  </p>
                  <h3 className="font-serif text-2xl tracking-tight text-wine-deep">{plan.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {plan.items.length} {plan.items.length === 1 ? "item" : "items"} in the order
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <span className="chip w-full justify-center">
                      Media {ready.ready}/{ready.total || 0}
                    </span>
                    <span className="chip w-full justify-center">
                      Assigned {plan.assignments.filter((row) => row.status === "accepted").length}/{plan.assignments.length}
                    </span>
                  </div>
                </Link>
              );
            })}
            {upcomingPlans.length === 0 ? <div className="paper-card rounded-3xl p-8 text-muted">No upcoming plans yet.</div> : null}
          </div>
        </>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {nextEvent ? (
            <Link href={`/events/${nextEvent.eventId}`} className="paper-card block rounded-3xl p-6 transition hover:-translate-y-0.5">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">Next up</p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight text-wine-deep">{nextEvent.title}</h2>
              <p className="mt-2 text-ink-soft">
                {formatShortDate(nextEvent.date)} · {nextEvent.time}
                {nextEvent.location ? ` · ${nextEvent.location}` : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip border-gold/55 bg-gold/15 text-wine-deep">{nextEvent.assignments.length} assigned</span>
                {nextEventConflicts.length > 0 ? (
                  <ConflictChip
                    tooltip={nextEventConflicts
                      .map((row) => (row.note ? `${row.personName}: ${row.range} — ${row.note}` : `${row.personName}: ${row.range}`))
                      .join(" · ")}
                  />
                ) : null}
              </div>
            </Link>
          ) : (
            <div className="paper-card rounded-3xl p-6 text-ink-soft">No upcoming events yet.</div>
          )}
          <article className="paper-card rounded-3xl p-6">
            <h2 className="font-serif text-3xl tracking-tight text-wine-deep">No setlists here</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Worship Planner is off for this org. Home uses events & assignments — same card language, no media chips.
            </p>
          </article>
        </div>
      )}

      {tab === "upcoming" ? (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="field-label">Org</p>
              <h2 className="font-serif text-3xl tracking-tight text-wine-deep">Activity</h2>
            </div>
            <Link href="/activity" className="text-sm text-wine underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-4">
            <ActivityList items={feed} empty="Nothing new yet. Assignments, replies, and new events will land here." />
          </div>
        </section>
      ) : null}

      {session.role === "member" && tab === "upcoming" ? (
        <section className="mt-12">
          <p className="field-label">Your schedule</p>
          <h2 className="font-serif text-3xl tracking-tight">Invites</h2>
          <ul className="mt-4 space-y-3">
            {myPlanAssignments.map(({ plan, assignment }) => (
              <li key={assignment.id} className="paper-card flex items-center justify-between rounded-2xl px-5 py-4">
                <div>
                  <Link href={`/plans/${plan.id}`} className="font-serif text-xl hover:underline">
                    {plan.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatShortDate(plan.date)} · {assignment.position}
                  </p>
                </div>
                <span className="chip">{assignment.status}</span>
              </li>
            ))}
            {myPlanAssignments.length === 0 ? <p className="text-muted">You haven’t been scheduled yet.</p> : null}
          </ul>
        </section>
      ) : session.role === "director" && worshipOn && tab === "upcoming" ? (
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Link href="/songs/new" className="paper-card rounded-3xl p-6 transition hover:-translate-y-0.5">
            <p className="field-label">Library</p>
            <h3 className="font-serif text-2xl">Add a song</h3>
            <p className="mt-2 text-ink-soft">Drop a YouTube link or upload rehearsal audio while it’s still in your head.</p>
          </Link>
          <Link href="/people" className="paper-card rounded-3xl p-6 transition hover:-translate-y-0.5">
            <p className="field-label">People</p>
            <h3 className="font-serif text-2xl">See the roster</h3>
            <p className="mt-2 text-ink-soft">Positions, pending replies, and who is already holding the room.</p>
          </Link>
        </section>
      ) : null}
    </div>
  );
}
