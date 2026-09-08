import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
import { getSession } from "@/lib/auth";
import { chatHref, chatThreads, messagesFor } from "@/lib/chat";
import { hasModule } from "@/lib/modules";
import { readStore } from "@/lib/store";
import { ModuleOffState } from "@/components/module-off-state";

export const metadata: Metadata = { title: "Chat" };

export default async function PlanChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "chat")) return <ModuleOffState moduleId="chat" />;
  if (!hasModule(store.modules, "worship")) redirect("/chat");
  const { id } = await params;
  const plan = store.plans.find((entry) => entry.id === id);
  if (!plan) notFound();
  const threads = chatThreads(store);
  const thread = threads.find((entry) => entry.planId === plan.id) ?? {
    kind: "plan" as const,
    href: chatHref({ kind: "plan", planId: plan.id }),
    title: plan.name,
    subtitle: plan.date,
    planId: plan.id,
  };

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
