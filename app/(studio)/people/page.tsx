import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addPersonAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { positionsFor } from "@/lib/modules";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const seats = positionsFor(store.orgType, store.modules);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="field-label">{store.churchName}</p>
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">People</h1>
      <p className="mt-3 max-w-xl text-ink-soft">Roster, roles, and contact. Members sign in to accept or decline from an event or plan.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {store.people.map((person) => {
            const planRows = store.plans.flatMap((plan) =>
              plan.assignments.filter((row) => row.personId === person.id).map((assignment) => ({ plan, assignment })),
            );
            const eventRows = store.events.flatMap((event) =>
              event.assignments.filter((row) => row.personId === person.id).map((assignment) => ({ event, assignment })),
            );
            return (
              <Link key={person.id} href={`/people/${person.id}`} className="paper-card block rounded-3xl p-5 transition hover:-translate-y-0.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl text-wine-deep">{person.name}</h2>
                    <p className="text-sm text-muted">
                      {person.defaultPosition}
                      {person.email ? ` · ${person.email}` : ""}
                    </p>
                  </div>
                  {person.userId ? <span className="chip">Has login</span> : null}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {eventRows.slice(0, 2).map(({ event, assignment }) => (
                    <li key={assignment.id} className="flex justify-between gap-3 text-ink-soft">
                      <span>{event.title}</span>
                      <span className="text-muted">
                        {assignment.position} · {assignment.status}
                      </span>
                    </li>
                  ))}
                  {planRows.slice(0, 2).map(({ plan, assignment }) => (
                    <li key={assignment.id} className="flex justify-between gap-3 text-ink-soft">
                      <span>
                        {plan.name} · {formatShortDate(plan.date)}
                      </span>
                      <span className="text-muted">
                        {assignment.position} · {assignment.status}
                      </span>
                    </li>
                  ))}
                  {eventRows.length + planRows.length === 0 ? <li className="text-muted">Not scheduled yet.</li> : null}
                </ul>
              </Link>
            );
          })}
        </div>

        {session.role === "director" ? (
          <form action={addPersonAction} className="paper-card h-fit space-y-4 rounded-3xl p-5">
            <p className="field-label">Add someone</p>
            <div>
              <label className="field-label" htmlFor="name">
                Name
              </label>
              <input id="name" name="name" required className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="defaultPosition">
                Usual seat
              </label>
              <select id="defaultPosition" name="defaultPosition" className="field" defaultValue={seats[0]}>
                {seats.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary w-full" type="submit">
              Add to roster
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
