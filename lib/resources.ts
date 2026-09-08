import { formatShortDate } from "./format";
import { expandOccurrences } from "./recurrence";
import type { Event, Plan, Resource, ResourceBooking, ResourceKind, StoreData } from "./types";

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  room: "Room",
  gear: "Gear",
};

export function isResourceKind(value: string): value is ResourceKind {
  return value === "room" || value === "gear";
}

export type BookableSlot = {
  key: string;
  kind: "event" | "plan";
  eventId?: string;
  planId?: string;
  date: string;
  time: string;
  title: string;
  href: string;
  label: string;
};

export function bookableSlots(store: Pick<StoreData, "events" | "plans" | "modules">, includePlans: boolean): BookableSlot[] {
  const slots: BookableSlot[] = [];

  for (const event of store.events) {
    for (const occurrence of expandOccurrences(event).slice(0, 24)) {
      slots.push({
        key: `event:${event.id}:${occurrence.date}`,
        kind: "event",
        eventId: event.id,
        date: occurrence.date,
        time: occurrence.time,
        title: event.title,
        href: `/events/${event.id}`,
        label: `${event.title} · ${formatShortDate(occurrence.date)} · ${occurrence.time}`,
      });
    }
  }

  if (includePlans) {
    for (const plan of store.plans) {
      slots.push({
        key: `plan:${plan.id}:${plan.date}`,
        kind: "plan",
        planId: plan.id,
        date: plan.date,
        time: plan.serviceTime,
        title: plan.name,
        href: `/plans/${plan.id}`,
        label: `${plan.name} · ${formatShortDate(plan.date)} · ${plan.serviceTime}`,
      });
    }
  }

  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function parseBookingTarget(value: string): { eventId?: string; planId?: string; date: string } | null {
  const [kind, id, date] = value.split(":");
  if (!id || !date) return null;
  if (kind === "event") return { eventId: id, date };
  if (kind === "plan") return { planId: id, date };
  return null;
}

export function bookingSlotKey(booking: Pick<ResourceBooking, "resourceId" | "date">): string {
  return `${booking.resourceId}:${booking.date}`;
}

export function bookingsForSlot(
  bookings: ResourceBooking[],
  resourceId: string,
  date: string,
  exceptId?: string,
): ResourceBooking[] {
  return bookings.filter(
    (booking) => booking.resourceId === resourceId && booking.date === date && booking.id !== exceptId,
  );
}

export function bookingHasConflict(bookings: ResourceBooking[], booking: ResourceBooking): boolean {
  return bookingsForSlot(bookings, booking.resourceId, booking.date, booking.id).length > 0;
}

export function bookingTarget(
  store: Pick<StoreData, "events" | "plans">,
  booking: ResourceBooking,
): { title: string; href: string; time: string } {
  if (booking.planId) {
    const plan = store.plans.find((entry) => entry.id === booking.planId);
    return {
      title: plan?.name ?? "Plan",
      href: `/plans/${booking.planId}`,
      time: plan?.serviceTime ?? "",
    };
  }
  if (booking.eventId) {
    const event = store.events.find((entry) => entry.id === booking.eventId);
    return {
      title: event?.title ?? "Event",
      href: `/events/${booking.eventId}`,
      time: event?.time ?? "",
    };
  }
  return { title: "Booking", href: "/resources", time: "" };
}

export function bookingsForTarget(
  bookings: ResourceBooking[],
  target: { eventId?: string; planId?: string; date?: string },
): ResourceBooking[] {
  return bookings.filter((booking) => {
    if (target.planId && booking.planId === target.planId) {
      return !target.date || booking.date === target.date;
    }
    if (target.eventId && booking.eventId === target.eventId) {
      return !target.date || booking.date === target.date;
    }
    return false;
  });
}

export function resourceById(resources: Resource[], id: string): Resource | undefined {
  return resources.find((resource) => resource.id === id);
}

export function resolveBookingSlot(
  store: Pick<StoreData, "events" | "plans">,
  input: { eventId?: string; planId?: string; date: string },
): { event?: Event; plan?: Plan; date: string } | null {
  if (input.planId) {
    const plan = store.plans.find((entry) => entry.id === input.planId);
    if (!plan) return null;
    if (input.date && input.date !== plan.date) return null;
    return { plan, date: plan.date };
  }
  if (input.eventId) {
    const event = store.events.find((entry) => entry.id === input.eventId);
    if (!event) return null;
    const dates = expandOccurrences(event).map((occurrence) => occurrence.date);
    if (!dates.includes(input.date)) return null;
    return { event, date: input.date };
  }
  return null;
}
