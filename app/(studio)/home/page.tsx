import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { firstName, formatShortDate, isUpcoming } from "@/lib/format";
import { mediaReadyCount } from "@/lib/media";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const upcoming = [...store.plans].filter((p) => isUpcoming(p.date)).sort((a, b) => a.date.localeCompare(b.date));
  const person = store.people.find((p) => p.userId === session.id);
  const myAssignments = store.plans.flatMap((plan) =>
    plan.assignments
      .filter((a) => a.personId === person?.id)
      .map((assignment) => ({ plan, assignment })),
  );
  const pending = myAssignments.filter((row) => row.assignment.status === "pending");

  return (
    <div className="mx-auto max-w-5xl">
      <p className="field-label">{store.churchName}</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">Good morning, {firstName(session.name)}.</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        {session.role === "director"
          ? "The room is ready. Draft a plan, finish the set, or see what’s still missing media."
          : "Open a plan, answer your invites, and rehearse without leaving Vestry."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="paper-card rounded-3xl p-5">
          <p className="field-label">Upcoming plans</p>
          <p className="font-serif text-4xl">{upcoming.length}</p>
        </article>
        <article className="paper-card rounded-3xl p-5">
          <p className="field-label">Songs in library</p>
          <p className="font-serif text-4xl">{store.songs.length}</p>
        </article>
        <article className="paper-card rounded-3xl p-5">
          <p className="field-label">{session.role === "director" ? "Awaiting replies" : "Your pending"}</p>
          <p className="font-serif text-4xl">
            {session.role === "director"
              ? store.plans.reduce((n, p) => n + p.assignments.filter((a) => a.status === "pending").length, 0)
              : pending.length}
          </p>
        </article>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">This season</p>
          <h2 className="font-serif text-3xl">Upcoming Sundays</h2>
        </div>
        {session.role === "director" ? (
          <Link href="/plans/new" className="btn btn-primary">
            Quick create
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        {upcoming.map((plan) => {
          const ready = mediaReadyCount(plan, store.songs);
          return (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="paper-card block rounded-3xl p-5 transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted">
                    {formatShortDate(plan.date)} · {plan.serviceTime}
                  </p>
                  <h3 className="font-serif text-2xl">{plan.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{plan.items.length} items in the order</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip">
                    Media {ready.ready}/{ready.total || 0}
                  </span>
                  <span className="chip">
                    Team {plan.assignments.filter((a) => a.status === "accepted").length}/{plan.assignments.length}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
        {upcoming.length === 0 ? (
          <div className="paper-card rounded-3xl p-8 text-muted">No upcoming plans yet.</div>
        ) : null}
      </div>

      {session.role === "member" ? (
        <section className="mt-12">
          <p className="field-label">Your schedule</p>
          <h2 className="font-serif text-3xl">Invites</h2>
          <ul className="mt-4 space-y-3">
            {myAssignments.map(({ plan, assignment }) => (
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
            {myAssignments.length === 0 ? <p className="text-muted">You haven’t been scheduled yet.</p> : null}
          </ul>
        </section>
      ) : (
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Link href="/songs/new" className="paper-card rounded-3xl p-6 transition hover:-translate-y-0.5">
            <p className="field-label">Library</p>
            <h3 className="font-serif text-2xl">Add a song</h3>
            <p className="mt-2 text-ink-soft">Drop a YouTube link or upload rehearsal audio while it’s still in your head.</p>
          </Link>
          <Link href="/team" className="paper-card rounded-3xl p-6 transition hover:-translate-y-0.5">
            <p className="field-label">People</p>
            <h3 className="font-serif text-2xl">See the team</h3>
            <p className="mt-2 text-ink-soft">Positions, pending replies, and who is already holding the room.</p>
          </Link>
        </section>
      )}
    </div>
  );
}
