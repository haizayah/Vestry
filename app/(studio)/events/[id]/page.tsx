import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { assignEventPersonAction, deleteEventAction, unassignEventPersonAction } from "@/lib/actions";
import { AssignmentResponse, AssignmentStatusChip } from "@/components/assignment-response";
import { ConflictChip } from "@/components/conflict-chip";
import { ReminderChip } from "@/components/reminder-chip";
import { ReminderToggle } from "@/components/reminder-toggle";
import { BookResourceForm, ResourceBookingList } from "@/components/resource-bookings";
import { ModuleOffState } from "@/components/module-off-state";
import { chatHref } from "@/lib/chat";
import { getSession } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { computeEventAssignmentConflicts } from "@/lib/lockout-api";
import { hasModule, positionsFor } from "@/lib/modules";
import { expandOccurrences, recurrenceSummary } from "@/lib/recurrence";
import { assignmentNeedsReminder } from "@/lib/reminders";
import { bookableSlots, bookingsForTarget } from "@/lib/resources";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Event" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "events")) return <ModuleOffState moduleId="events" />;
  const { id } = await params;
  const event = store.events.find((entry) => entry.id === id);
  if (!event) notFound();

  const director = session.role === "director";
  const me = store.people.find((person) => person.userId === session.id);
  const occurrences = expandOccurrences(event);
  const conflicts = await computeEventAssignmentConflicts(event.id, event.date);
  const seats = positionsFor(store.orgType, store.modules);
  const resourcesOn = hasModule(store.modules, "resources");
  const eventBookings = bookingsForTarget(store.bookings, { eventId: event.id });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field-label">{formatShortDate(event.date)}</p>
          <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">{event.title}</h1>
          <p className="mt-2 text-ink-soft">
            {event.time}
            {event.location ? ` · ${event.location}` : ""} · {recurrenceSummary(event.recurrence)}
          </p>
        </div>
        {director ? (
          <form action={deleteEventAction}>
            <input type="hidden" name="id" value={event.id} />
            <button className="btn btn-danger" type="submit">
              Delete event
            </button>
          </form>
        ) : null}
      </div>

      {event.notes ? <p className="paper-card mt-6 rounded-3xl p-5 text-ink-soft">{event.notes}</p> : null}

      {hasModule(store.modules, "chat") ? (
        <Link href={chatHref({ kind: "event", eventId: event.id })} className="paper-card mt-4 block rounded-3xl p-5 transition hover:-translate-y-0.5">
          <p className="field-label">Chat</p>
          <h2 className="font-serif text-2xl text-wine-deep">Event thread</h2>
          <p className="mt-2 text-sm text-ink-soft">Directors and members can post about this event.</p>
        </Link>
      ) : null}

      <section className="mt-10">
        <p className="field-label">Occurrences</p>
        <h2 className="font-serif text-2xl text-wine-deep">Series dates</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {occurrences.slice(0, 12).map((occurrence) => (
            <li key={occurrence.date} className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
              {formatShortDate(occurrence.date)} · {occurrence.time}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <p className="field-label">People</p>
        <h2 className="font-serif text-2xl text-wine-deep">Assignments</h2>
        <ul className="space-y-3">
          {event.assignments.map((assignment) => {
            const person = store.people.find((entry) => entry.id === assignment.personId);
            const tooltip = director ? conflicts[assignment.id] : undefined;
            const mine = me?.id === assignment.personId;
            return (
              <li key={assignment.id} className="paper-card rounded-2xl px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/people/${assignment.personId}`} className="font-serif text-xl text-wine-deep hover:underline">
                      {person?.name ?? "Unknown"}
                    </Link>
                    <p className="text-sm text-muted">{assignment.position}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tooltip ? <ConflictChip tooltip={tooltip} /> : null}
                    {assignmentNeedsReminder(assignment.reminder, event.date, assignment.status) ? <ReminderChip /> : null}
                    <AssignmentStatusChip status={assignment.status} />
                  </div>
                </div>
                {mine || director ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <AssignmentResponse
                      assignmentId={assignment.id}
                      status={assignment.status}
                      eventId={event.id}
                    />
                    <ReminderToggle
                      assignmentId={assignment.id}
                      reminder={assignment.reminder}
                      eventId={event.id}
                    />
                    {director ? (
                      <form action={unassignEventPersonAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <button className="btn btn-danger px-3 py-1.5 text-sm" type="submit">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {director ? (
          <form action={assignEventPersonAction} className="paper-card grid gap-3 rounded-3xl p-5 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="eventId" value={event.id} />
            <select name="personId" className="field" required defaultValue="">
              <option value="" disabled>
                Assign someone
              </option>
              {store.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select name="position" className="field" defaultValue={seats[0]}>
              {seats.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Assign
            </button>
          </form>
        ) : null}
      </section>

      {resourcesOn ? (
        <section className="mt-10 space-y-4">
          <p className="field-label">Resources</p>
          <h2 className="font-serif text-2xl text-wine-deep">Rooms & gear</h2>
          <ResourceBookingList
            resources={store.resources}
            bookings={eventBookings}
            allBookings={store.bookings}
            events={store.events}
            plans={store.plans}
            director={director}
          />
          {director ? (
            <div className="paper-card space-y-3 rounded-3xl p-5">
              <p className="field-label">Book an occurrence</p>
              <BookResourceForm
                resources={store.resources}
                slots={bookableSlots({ events: [event], plans: [], modules: store.modules }, false)}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
