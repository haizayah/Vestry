import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { hasModule } from "@/lib/modules";
import { recurrenceSummary } from "@/lib/recurrence";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "events")) return <ModuleOffState moduleId="events" />;
  const events = [...store.events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">{store.churchName}</p>
          <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Events</h1>
        </div>
        {session.role === "director" ? (
          <Link href="/calendar?new=event" className="btn btn-primary">
            New event
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`} className="paper-card block rounded-3xl p-6 transition hover:-translate-y-0.5">
            <p className="text-sm text-muted">
              {formatShortDate(event.date)} · {event.time}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-wine-deep">{event.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {recurrenceSummary(event.recurrence)} · {event.assignments.length} assigned
            </p>
          </Link>
        ))}
        {events.length === 0 ? (
          <div className="paper-card rounded-3xl p-8 text-ink-soft">
            No events yet.
            {session.role === "director" ? (
              <>
                {" "}
                <Link href="/calendar?new=event" className="text-wine underline-offset-4 hover:underline">
                  Create one
                </Link>
                .
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
