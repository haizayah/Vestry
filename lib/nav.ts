import { hasModule } from "./modules";
import type { ModuleId } from "./types";

export type NavItem = {
  href: string;
  label: string;
  module?: ModuleId;
  moreMeta?: string;
};

export const CORE_NAV: NavItem[] = [
  { href: "/home", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/people", label: "People" },
  { href: "/schedule", label: "Schedule" },
];

export const MODULE_NAV: NavItem[] = [
  { href: "/events", label: "Events", module: "events", moreMeta: "On" },
  { href: "/plans", label: "Plans", module: "worship", moreMeta: "Worship" },
  { href: "/songs", label: "Songs", module: "worship", moreMeta: "Worship" },
  { href: "/chat", label: "Chat", module: "chat", moreMeta: "On" },
  { href: "/resources", label: "Resources", module: "resources", moreMeta: "On" },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/settings", label: "Settings" },
  { href: "/availability", label: "Availability" },
];

export function visibleNav(items: NavItem[], modules: readonly ModuleId[]): NavItem[] {
  return items.filter((item) => !item.module || hasModule(modules, item.module));
}

export function desktopPrimaryNav(modules: readonly ModuleId[]): NavItem[] {
  return [...CORE_NAV, ...visibleNav(MODULE_NAV, modules)];
}

export function moreItems(modules: readonly ModuleId[]): NavItem[] {
  return [...visibleNav(MODULE_NAV, modules), ...ACCOUNT_NAV];
}

export function dockItems(): NavItem[] {
  return CORE_NAV;
}
