import Link from "next/link";
import { bookResourceAction, unbookResourceAction } from "@/lib/actions";
import { formatShortDate } from "@/lib/format";
import { bookingHasConflict, bookingTarget, RESOURCE_KIND_LABELS, type BookableSlot } from "@/lib/resources";
import type { Event, Plan, Resource, ResourceBooking } from "@/lib/types";
import { ConflictChip } from "./conflict-chip";

export function ResourceBookingList({
  resources,
  bookings,
  allBookings,
  events,
  plans,
  director,
}: {
  resources: Resource[];
  bookings: ResourceBooking[];
  allBookings: ResourceBooking[];
  events: Event[];
  plans: Plan[];
  director: boolean;
}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted">Nothing booked yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {bookings.map((booking) => {
        const resource = resources.find((entry) => entry.id === booking.resourceId);
        const target = bookingTarget({ events, plans }, booking);
        const overlap = bookingHasConflict(allBookings, booking);
        return (
          <li key={booking.id} className="paper-card rounded-2xl px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-serif text-xl text-wine-deep">{resource?.name ?? "Resource"}</p>
                <p className="text-sm text-muted">
                  {resource ? RESOURCE_KIND_LABELS[resource.kind] : "—"} · {formatShortDate(booking.date)}
                  {target.time ? ` · ${target.time}` : ""}
                </p>
                <Link href={target.href} className="mt-1 inline-block text-sm text-wine underline-offset-4 hover:underline">
                  {target.title}
                </Link>
                {booking.notes ? <p className="mt-2 text-sm text-ink-soft">{booking.notes}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {overlap ? (
                  <ConflictChip
                    tooltip={`${resource?.name ?? "Resource"} is also booked on ${formatShortDate(booking.date)}. Save still went through.`}
                  />
                ) : null}
                {director ? (
                  <form action={unbookResourceAction}>
                    <input type="hidden" name="id" value={booking.id} />
                    <button className="btn btn-danger px-3 py-1.5 text-sm" type="submit">
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BookResourceForm({
  resources,
  slots,
  presetTarget,
}: {
  resources: Resource[];
  slots: BookableSlot[];
  presetTarget?: string;
}) {
  if (resources.length === 0 || (slots.length === 0 && !presetTarget)) {
    return <p className="text-sm text-muted">Add a room or piece of gear, then pick an event or plan to book.</p>;
  }

  return (
    <form action={bookResourceAction} className="grid gap-3">
      <select name="resourceId" className="field" required defaultValue="">
        <option value="" disabled>
          Choose a room or gear
        </option>
        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.name} · {RESOURCE_KIND_LABELS[resource.kind]}
          </option>
        ))}
      </select>
      {presetTarget ? (
        <input type="hidden" name="target" value={presetTarget} />
      ) : (
        <select name="target" className="field" required defaultValue="">
          <option value="" disabled>
            Book against an event or plan
          </option>
          {slots.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
      )}
      <input name="notes" className="field" placeholder="Optional notes" />
      <button className="btn btn-primary" type="submit">
        Book
      </button>
      <p className="text-sm text-muted">Double-booking the same slot shows a gold warning — it never blocks save.</p>
    </form>
  );
}
