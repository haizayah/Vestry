import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { getSession } from "@/lib/auth";
import { accessibleChatThreads, listChatMessages } from "@/lib/chat-access";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "chat")) return <ModuleOffState moduleId="chat" />;
  const threads = accessibleChatThreads(store, session);
  const thread = threads.find((entry) => entry.kind === "team") ?? {
    kind: "team" as const,
    href: "/chat",
    title: "Team",
    subtitle: "Everyone in the org",
  };
  const messages = listChatMessages(store, session, thread);
  if (!messages) notFound();

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
