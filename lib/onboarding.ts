import type { Role } from "./types";

export function directorNeedsOnboarding(role: Role, completedAt: string | null | undefined): boolean {
  return role === "director" && !completedAt;
}

export function postLoginPath(role: Role, completedAt: string | null | undefined): string {
  return directorNeedsOnboarding(role, completedAt) ? "/onboarding" : "/home";
}
