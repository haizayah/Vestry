import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConflictChip } from "@/components/conflict-chip";
import { getSession } from "@/lib/auth";
import { firstName, formatShortDate, isUpcoming, timeGreeting, todayISO } from "@/lib/format";
import { listLockoutsForConflictRead } from "@/lib/lockout-api";
import { conflictsForAssignments } from "@/lib/lockouts";
import { mediaReadyCount } from "@/lib/media";
import { hasModule, moduleSummary, ORG_TYPE_LABELS } from "@/lib/modules";
import { nextOccurrence } from "@/lib/recurrence";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const tab = (await searchParams).tab === "attention" ? "attention" : "upcoming";
  const store = await readStore();
  const worshipOn = hasModule(store.modules, "worship");
  const eventsOn = hasModule(store.modules, "events");
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
  const pending = myPlanAssignments.filter((row) => row.assignment.status === "pending");
  const nextEvent = upcomingEvents[0];
  const nextEventConflicts = nextEvent
    ? conflictsForAssignments(nextEvent.assignments, nextEvent.date, lockouts, store.people)
    : [];

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
            Needs attention
          </Link>
        </div>
        {session.role === "director" ? (
          <Link href={eventsOn && !worshipOn ? "/calendar?new=event" : "/plans/new"} className="btn btn-primary">
            Quick create
          </Link>
        ) : null}
      </div>

      {worshipOn ? (
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
              <p className="font-serif text-4xl tracking-tight">
                {session.role === "director"
                  ? store.plans.reduce((n, plan) => n + plan.assignments.filter((row) => row.status === "pending").length, 0)
                  : pending.length}
              </p>
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
          {tab === "attention" ? (
            <article className="paper-card rounded-3xl p-6 md:col-span-2">
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
          ) : nextEvent ? (
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

      {session.role === "member" ? (
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
      ) : worshipOn ? (
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
