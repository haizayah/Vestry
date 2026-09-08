import type { ModuleId, OrgType, StoreData } from "./types";
import { GENERIC_POSITIONS, MODULE_IDS, ORG_TYPES, POSITIONS, SPORTS_POSITIONS } from "./types";

export const ALWAYS_ON_MODULES: ModuleId[] = ["calendar", "people"];

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  church: "Church",
  sports: "Sports",
  nonprofit: "Nonprofit",
  creative: "Creative",
  ops: "Ops",
  other: "Other",
};

export type ModuleMeta = {
  id: ModuleId;
  label: string;
  description: string;
  alwaysOn?: boolean;
  optional?: boolean;
  later?: boolean;
};

export const MODULE_CARDS: ModuleMeta[] = [
  { id: "calendar", label: "Calendar", description: "Month & week views, events, conflicts", alwaysOn: true },
  { id: "people", label: "People", description: "Roster, roles, contact", alwaysOn: true },
  { id: "scheduling", label: "Teams & Scheduling", description: "Positions, assignments, availability" },
  { id: "events", label: "Events", description: "Games, rehearsals, one-offs & recurring" },
  { id: "worship", label: "Worship Planner", description: "Songs, setlists, in-app media", optional: true },
  { id: "chat", label: "Chat", description: "Team channel and plan or event threads", optional: true },
  { id: "resources", label: "Resources & Rooms", description: "Rooms and gear, booked against events", optional: true },
];

export const DEFAULT_CHURCH_MODULES: ModuleId[] = ["calendar", "people", "scheduling", "events", "worship"];
export const DEFAULT_SPORTS_MODULES: ModuleId[] = ["calendar", "people", "scheduling", "events"];

export function isOrgType(value: string): value is OrgType {
  return (ORG_TYPES as readonly string[]).includes(value);
}

export function isModuleId(value: string): value is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(value);
}

export function normalizeModules(modules: readonly string[] | undefined): ModuleId[] {
  const set = new Set<ModuleId>();
  for (const id of ALWAYS_ON_MODULES) set.add(id);
  for (const raw of modules ?? DEFAULT_CHURCH_MODULES) {
    if (isModuleId(raw)) set.add(raw);
  }
  return MODULE_IDS.filter((id) => set.has(id));
}

export function hasModule(modules: readonly ModuleId[] | undefined, id: ModuleId): boolean {
  if (ALWAYS_ON_MODULES.includes(id)) return true;
  return (modules ?? []).includes(id);
}

export function orgName(store: Pick<StoreData, "churchName">): string {
  return store.churchName;
}

export function moduleSummary(modules: readonly ModuleId[]): string {
  const labels: string[] = [];
  if (hasModule(modules, "calendar")) labels.push("Calendar");
  if (hasModule(modules, "people")) labels.push("People");
  if (hasModule(modules, "scheduling")) labels.push("Schedule");
  if (hasModule(modules, "events")) labels.push("Events");
  if (hasModule(modules, "worship")) labels.push("Worship");
  if (hasModule(modules, "chat")) labels.push("Chat");
  if (hasModule(modules, "resources")) labels.push("Resources");
  return labels.join(", ");
}

export function positionsFor(orgType: OrgType, modules: readonly ModuleId[]): readonly string[] {
  if (hasModule(modules, "worship") || orgType === "church") return POSITIONS;
  if (orgType === "sports") return SPORTS_POSITIONS;
  return GENERIC_POSITIONS;
}

export function suggestedModules(orgType: OrgType): ModuleId[] {
  return orgType === "church" ? DEFAULT_CHURCH_MODULES : DEFAULT_SPORTS_MODULES;
}

export function roleLabel(role: "director" | "member"): string {
  return role === "director" ? "Director" : "Member";
}
