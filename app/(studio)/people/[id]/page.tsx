import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Person" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const store = await readStore();
  const person = store.people.find((entry) => entry.id === id);
  if (!person) notFound();

  const planRows = store.plans.flatMap((plan) =>
    plan.assignments.filter((row) => row.personId === person.id).map((assignment) => ({ plan, assignment })),
  );
  const eventRows = store.events.flatMap((event) =>
    event.assignments.filter((row) => row.personId === person.id).map((assignment) => ({ event, assignment })),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <p className="field-label">People</p>
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">{person.name}</h1>
      <p className="mt-3 text-ink-soft">
        {person.defaultPosition}
        {person.email ? ` · ${person.email}` : ""}
        {person.userId ? " · Has login" : ""}
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-wine-deep">Assignments</h2>
        {eventRows.map(({ event, assignment }) => (
          <Link key={assignment.id} href={`/events/${event.id}`} className="paper-card flex items-center justify-between rounded-2xl px-5 py-4">
            <div>
              <p className="font-serif text-xl">{event.title}</p>
              <p className="text-sm text-muted">
                {formatShortDate(event.date)} · {event.time} · {assignment.position}
              </p>
            </div>
            <span className="chip">{assignment.status}</span>
          </Link>
        ))}
        {planRows.map(({ plan, assignment }) => (
          <Link key={assignment.id} href={`/plans/${plan.id}`} className="paper-card flex items-center justify-between rounded-2xl px-5 py-4">
            <div>
              <p className="font-serif text-xl">{plan.name}</p>
              <p className="text-sm text-muted">
                {formatShortDate(plan.date)} · {assignment.position}
              </p>
            </div>
            <span className="chip">{assignment.status}</span>
          </Link>
        ))}
        {eventRows.length + planRows.length === 0 ? (
          <p className="paper-card rounded-3xl p-6 text-ink-soft">Not scheduled on an upcoming event or plan.</p>
        ) : null}
      </section>
    </div>
  );
}
