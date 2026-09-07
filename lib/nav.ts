import { hasModule } from "./modules";
import type { ModuleId } from "./types";

export type NavItem = {
  href: string;
  label: string;
  module?: ModuleId;
  moreMeta?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/calendar", label: "Calendar", module: "calendar" },
  { href: "/people", label: "People", module: "people" },
  { href: "/schedule", label: "Schedule", module: "scheduling" },
  { href: "/events", label: "Events", module: "events" },
  { href: "/chat", label: "Chat", module: "chat" },
  { href: "/plans", label: "Plans", module: "worship" },
  { href: "/songs", label: "Songs", module: "worship" },
];

export function visibleNav(items: NavItem[], modules: readonly ModuleId[]): NavItem[] {
  return items.filter((item) => !item.module || hasModule(modules, item.module));
}

export function desktopPrimaryNav(modules: readonly ModuleId[]): NavItem[] {
  return visibleNav(PRIMARY_NAV, modules);
}

export function moreItems(modules: readonly ModuleId[]): NavItem[] {
  const extras: NavItem[] = [];
  if (hasModule(modules, "events")) extras.push({ href: "/events", label: "Events", moreMeta: "On" });
  if (hasModule(modules, "chat")) extras.push({ href: "/chat", label: "Chat", moreMeta: "On" });
  if (hasModule(modules, "worship")) {
    extras.push({ href: "/plans", label: "Plans", moreMeta: "Worship" });
    extras.push({ href: "/songs", label: "Songs", moreMeta: "Worship" });
  }
  if (hasModule(modules, "scheduling")) {
    extras.push({ href: "/availability", label: "Availability", moreMeta: "Scheduling" });
  }
  extras.push({ href: "/settings", label: "Settings" });
  return extras;
}

export function dockItems(modules: readonly ModuleId[]): NavItem[] {
  const dock: NavItem[] = [
    { href: "/home", label: "Home" },
    { href: "/calendar", label: "Calendar" },
    { href: "/people", label: "People" },
  ];
  if (hasModule(modules, "scheduling")) dock.push({ href: "/schedule", label: "Schedule" });
  else if (hasModule(modules, "events")) dock.push({ href: "/events", label: "Events" });
  return dock;
}
