import { hasModule } from "./modules";
import { newId } from "./store";
import type { ActivityItem, ActivityKind, ModuleId, StoreData } from "./types";

const KEEP = 80;

export function recordActivity(
  store: StoreData,
  input: {
    kind: ActivityKind;
    actorUserId: string;
    actorName: string;
    summary: string;
    href?: string;
    createdAt?: string;
  },
) {
  store.activity.unshift({
    id: newId("act"),
    createdAt: input.createdAt ?? new Date().toISOString(),
    kind: input.kind,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    summary: input.summary,
    href: input.href,
  });
  if (store.activity.length > KEEP) store.activity.length = KEEP;
}

export function visibleActivity(items: ActivityItem[], modules: readonly ModuleId[]): ActivityItem[] {
  return items.filter((item) => {
    if (item.kind === "chat") return hasModule(modules, "chat");
    if (item.kind === "plan") return hasModule(modules, "worship");
    if (item.kind === "event" || item.kind === "series") return hasModule(modules, "events");
    if (item.kind === "booking") return hasModule(modules, "resources");
    return true;
  });
}

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  assigned: "Assigned",
  accepted: "Accepted",
  declined: "Declined",
  event: "Event",
  series: "Series",
  plan: "Plan",
  chat: "Chat",
  booking: "Booking",
  reminder: "Reminder",
};
