import { chatThreads, messagesFor, type ChatThread } from "./chat";
import { hasModule } from "./modules";
import type { Assignment, ChatMessage, PublicUser, StoreData } from "./types";

export type ChatThreadRef = Pick<ChatThread, "kind" | "planId" | "eventId">;

function personIdForSession(store: StoreData, session: PublicUser): string | undefined {
  return store.people.find((person) => person.userId === session.id)?.id;
}

function isAssigned(assignments: Assignment[], personId: string | undefined): boolean {
  return Boolean(personId && assignments.some((row) => row.personId === personId));
}

/**
 * Fail-closed chat authorization.
 * Team is org-wide. Plan/event threads require a director or an assignment on that host.
 * Missing hosts and unassigned members both return false so callers can 404 without leaking existence.
 */
export function canAccessChatThread(
  store: StoreData,
  session: PublicUser,
  thread: ChatThreadRef,
): boolean {
  if (thread.kind === "team") return true;

  if (thread.kind === "plan") {
    const plan = thread.planId ? store.plans.find((entry) => entry.id === thread.planId) : undefined;
    if (!plan) return false;
    if (session.role === "director") return true;
    return isAssigned(plan.assignments, personIdForSession(store, session));
  }

  if (thread.kind === "event") {
    const event = thread.eventId ? store.events.find((entry) => entry.id === thread.eventId) : undefined;
    if (!event) return false;
    if (session.role === "director") return true;
    return isAssigned(event.assignments, personIdForSession(store, session));
  }

  return false;
}

/** Write-path gate: Chat module plus membership. Throws instead of distinguishing missing vs unauthorized. */
export function assertCanAccessChatThread(
  store: StoreData,
  session: PublicUser,
  thread: ChatThreadRef,
): void {
  if (!hasModule(store.modules, "chat")) throw new Error("Chat is off");
  if (thread.kind === "plan" && !hasModule(store.modules, "worship")) throw new Error("Forbidden");
  if (thread.kind === "event" && !hasModule(store.modules, "events")) throw new Error("Forbidden");
  if (!canAccessChatThread(store, session, thread)) throw new Error("Forbidden");
}

export function accessibleChatThreads(store: StoreData, session: PublicUser): ChatThread[] {
  return chatThreads(store).filter((thread) => canAccessChatThread(store, session, thread));
}

export function listChatMessages(
  store: StoreData,
  session: PublicUser,
  thread: ChatThreadRef,
): ChatMessage[] | null {
  if (!canAccessChatThread(store, session, thread)) return null;
  return messagesFor(store.messages, thread);
}
