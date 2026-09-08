import type { OrgType } from "./types";

export const ACCENT_PRESETS = {
  church: {
    label: "Wine",
    deep: "#4a1c28",
    mid: "#6b2d3c",
    bright: "#8a3d4f",
  },
  sports: {
    label: "Teal",
    deep: "#0f3d38",
    mid: "#1a6b63",
    bright: "#2a8f85",
  },
} as const;

export type AccentPreset = keyof typeof ACCENT_PRESETS;

export function orgAccent(orgType: OrgType): AccentPreset {
  return orgType === "sports" ? "sports" : "church";
}
