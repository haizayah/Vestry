import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { getSession } from "@/lib/auth";
import { chatThreads, messagesFor } from "@/lib/chat";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "chat")) return <ModuleOffState moduleId="chat" />;
  const threads = chatThreads(store);
  const thread = threads[0];

  return (
    <ChatRoom
      thread={thread}
      threads={threads}
      messages={messagesFor(store.messages, thread)}
      users={store.users}
      user={session}
    />
  );
}
