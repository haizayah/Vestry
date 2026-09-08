import Link from "next/link";
import { postChatAction } from "@/lib/actions";
import { isSameThread, type ChatThread } from "@/lib/chat";
import { formatStamp } from "@/lib/format";
import { roleLabel } from "@/lib/modules";
import type { ChatMessage, PublicUser, User } from "@/lib/types";

export function ChatRoom({
  thread,
  threads,
  messages,
  users,
  user,
}: {
  thread: ChatThread;
  threads: ChatThread[];
  messages: ChatMessage[];
  users: User[];
  user: PublicUser;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-4xl tracking-tight text-wine-deep md:text-5xl">Chat</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Team channel plus a thread per plan or event. Directors and members can both post.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <p className="field-label">Threads</p>
          <ul className="mt-3 space-y-2">
            {threads.map((entry) => {
              const active = isSameThread(entry, thread);
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className={`block rounded-2xl px-4 py-3 ${
                      active ? "border-2 border-wine-deep bg-card" : "border border-line bg-card/70 hover:bg-card"
                    }`}
                  >
                    <p className="font-serif text-lg text-wine-deep">{entry.title}</p>
                    <p className="text-sm text-muted">{entry.subtitle}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="paper-card flex min-h-[28rem] flex-col rounded-[1.75rem] p-5 sm:p-6">
          <div>
            <p className="field-label">{thread.kind === "team" ? "Channel" : "Thread"}</p>
            <h2 className="font-serif text-3xl text-wine-deep">{thread.title}</h2>
            <p className="mt-1 text-sm text-muted">{thread.subtitle}</p>
          </div>

          <div className="mt-6 flex-1 space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-line px-5 py-12 text-center">
                <h3 className="font-serif text-2xl text-wine-deep">No messages yet</h3>
                <p className="mt-2 text-ink-soft">Start the thread. Directors and members can both write here.</p>
              </div>
            ) : (
              messages.map((message) => {
                const author = users.find((entry) => entry.id === message.authorUserId);
                return (
                  <article key={message.id} className="border-b border-line/70 pb-4 last:border-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-wine-deep">{author?.name ?? "Someone"}</p>
                      <p className="text-sm text-muted">{formatStamp(message.createdAt)}</p>
                    </div>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-gold">
                      {author ? roleLabel(author.role) : "Member"}
                    </p>
                    <p className="mt-2 leading-relaxed text-ink-soft">{message.body}</p>
                  </article>
                );
              })
            )}
          </div>

          <form action={postChatAction} className="mt-6 space-y-3 border-t border-line pt-5">
            <input type="hidden" name="threadKind" value={thread.kind} />
            {thread.planId ? <input type="hidden" name="planId" value={thread.planId} /> : null}
            {thread.eventId ? <input type="hidden" name="eventId" value={thread.eventId} /> : null}
            <label className="field-label" htmlFor="chat-body">
              Write as {user.name}
            </label>
            <textarea
              id="chat-body"
              name="body"
              rows={3}
              required
              maxLength={2000}
              className="field"
              placeholder="Write to this thread…"
            />
            <div className="flex justify-end">
              <button className="btn btn-primary" type="submit">
                Post
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
