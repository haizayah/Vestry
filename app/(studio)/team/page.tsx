import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addPersonAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { readStore } from "@/lib/store";
import { POSITIONS } from "@/lib/types";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="field-label">{store.churchName}</p>
      <h1 className="font-serif text-4xl md:text-5xl">Team</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        A light roster for Sunday positions. Members sign in to accept or decline from the plan itself.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {store.people.map((person) => {
            const assignments = store.plans.flatMap((plan) =>
              plan.assignments.filter((a) => a.personId === person.id).map((assignment) => ({ plan, assignment })),
            );
            return (
              <article key={person.id} className="paper-card rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl">{person.name}</h2>
                    <p className="text-sm text-muted">
                      {person.defaultPosition}
                      {person.email ? ` · ${person.email}` : ""}
                    </p>
                  </div>
                  {person.userId ? <span className="chip">Has login</span> : null}
                </div>
                <ul className="mt-4 space-y-2">
                  {assignments.map(({ plan, assignment }) => (
                    <li key={assignment.id} className="flex items-center justify-between text-sm">
                      <Link href={`/plans/${plan.id}`} className="text-sage underline-offset-4 hover:underline">
                        {plan.name} · {formatShortDate(plan.date)}
                      </Link>
                      <span className="text-muted">
                        {assignment.position} · {assignment.status}
                      </span>
                    </li>
                  ))}
                  {assignments.length === 0 ? <li className="text-sm text-muted">Not scheduled on an upcoming plan.</li> : null}
                </ul>
              </article>
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
              <select id="defaultPosition" name="defaultPosition" className="field" defaultValue="Vocals">
                {POSITIONS.map((position) => (
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
