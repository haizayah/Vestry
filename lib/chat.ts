import { formatShortDate } from "./format";
import { hasModule } from "./modules";
import type { ChatMessage, ChatThreadKind, StoreData } from "./types";

export type ChatThread = {
  kind: ChatThreadKind;
  href: string;
  title: string;
  subtitle: string;
  planId?: string;
  eventId?: string;
};

export function chatHref(thread: Pick<ChatThread, "kind" | "planId" | "eventId">): string {
  if (thread.kind === "plan" && thread.planId) return `/chat/plan/${thread.planId}`;
  if (thread.kind === "event" && thread.eventId) return `/chat/event/${thread.eventId}`;
  return "/chat";
}

export function chatThreads(store: StoreData): ChatThread[] {
  const threads: ChatThread[] = [{ kind: "team", href: "/chat", title: "Team", subtitle: "Everyone in the org" }];

  if (hasModule(store.modules, "worship")) {
    for (const plan of [...store.plans].sort((a, b) => a.date.localeCompare(b.date))) {
      threads.push({
        kind: "plan",
        href: chatHref({ kind: "plan", planId: plan.id }),
        title: plan.name,
        subtitle: formatShortDate(plan.date),
        planId: plan.id,
      });
    }
  }

  if (hasModule(store.modules, "events")) {
    for (const event of [...store.events].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))) {
      threads.push({
        kind: "event",
        href: chatHref({ kind: "event", eventId: event.id }),
        title: event.title,
        subtitle: formatShortDate(event.date),
        eventId: event.id,
      });
    }
  }

  return threads;
}

export function threadTitle(store: StoreData, thread: Pick<ChatThread, "kind" | "planId" | "eventId">): string {
  if (thread.kind === "plan") {
    return store.plans.find((plan) => plan.id === thread.planId)?.name ?? "Plan";
  }
  if (thread.kind === "event") {
    return store.events.find((event) => event.id === thread.eventId)?.title ?? "Event";
  }
  return "Team";
}

export function messagesFor(messages: ChatMessage[], thread: Pick<ChatThread, "kind" | "planId" | "eventId">): ChatMessage[] {
  return messages
    .filter((message) => {
      if (thread.kind === "team") return message.threadKind === "team";
      if (thread.kind === "plan") return message.threadKind === "plan" && message.planId === thread.planId;
      return message.threadKind === "event" && message.eventId === thread.eventId;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function isSameThread(a: Pick<ChatThread, "kind" | "planId" | "eventId">, b: Pick<ChatThread, "kind" | "planId" | "eventId">) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "plan") return a.planId === b.planId;
  if (a.kind === "event") return a.eventId === b.eventId;
  return true;
}
