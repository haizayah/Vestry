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

export default async function PlanChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  if (!hasModule(store.modules, "chat")) return <ModuleOffState moduleId="chat" />;
  if (!hasModule(store.modules, "worship")) redirect("/chat");
  const { id } = await params;
  const threadRef = { kind: "plan" as const, planId: id };
  if (!canAccessChatThread(store, session, threadRef)) notFound();
  const plan = store.plans.find((entry) => entry.id === id);
  if (!plan) notFound();
  const threads = accessibleChatThreads(store, session);
  const messages = listChatMessages(store, session, threadRef);
  if (!messages) notFound();
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
      messages={messages}
      users={store.users}
      user={session}
    />
  );
}
