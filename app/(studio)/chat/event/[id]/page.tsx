import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { getSession } from "@/lib/auth";
import { chatHref } from "@/lib/chat";
import { accessibleChatThreads, canAccessChatThread, listChatMessages } from "@/lib/chat-access";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Chat" };

export default async function EventChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "chat")) return <ModuleOffState moduleId="chat" />;
  if (!hasModule(store.modules, "events")) redirect("/chat");
  const { id } = await params;
  const threadRef = { kind: "event" as const, eventId: id };
  if (!canAccessChatThread(store, session, threadRef)) notFound();
  const event = store.events.find((entry) => entry.id === id);
  if (!event) notFound();
  const threads = accessibleChatThreads(store, session);
  const messages = listChatMessages(store, session, threadRef);
  if (!messages) notFound();
  const thread = threads.find((entry) => entry.eventId === event.id) ?? {
    kind: "event" as const,
    href: chatHref({ kind: "event", eventId: event.id }),
    title: event.title,
    subtitle: event.date,
    eventId: event.id,
  };

  return (
    <ChatRoom
      thread={thread}
      threads={threads}
      messages={messages}
      users={store.users}
      user={session}
    />
  );
}
