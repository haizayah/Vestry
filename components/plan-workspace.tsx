"use client";

import Link from "next/link";
import { useState } from "react";
import {
  addPlanItemAction,
  assignPersonAction,
  movePlanItemAction,
  removePlanItemAction,
  unassignPersonAction,
  updatePlanItemAction,
  updatePlanMetaAction,
} from "@/lib/actions";
import { AssignmentResponse, AssignmentStatusChip } from "@/components/assignment-response";
import { chatHref } from "@/lib/chat";
import { audioSrc, hasYouTube, resolveItem } from "@/lib/media";
import { ITEM_LABELS, POSITIONS, type Person, type Plan, type PlanItemType, type PublicUser, type Song } from "@/lib/types";
import { AudioUploader } from "./audio-uploader";
import { ConflictChip } from "./conflict-chip";
import { RehearsalDock } from "./rehearsal-dock";

export function PlanWorkspace({
  plan,
  songs,
  people,
  user,
  assignmentConflicts,
  chatOn = false,
}: {
  plan: Plan;
  songs: Song[];
  people: Person[];
  user: PublicUser;
  assignmentConflicts: Record<string, string>;
  chatOn?: boolean;
}) {
  const director = user.role === "director";
  const me = people.find((p) => p.userId === user.id);
  const [addType, setAddType] = useState<PlanItemType>("song");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedItem = plan.items.find((item) => item.id === focusedId);
  const focusedResolved = focusedItem ? resolveItem(focusedItem, songs) : null;
  const focusedYoutube = focusedResolved && hasYouTube(focusedResolved.youtubeUrl) ? focusedResolved.youtubeUrl : "";
  const focusedAudio = focusedResolved ? audioSrc(focusedResolved.audioFilename) : null;
  const focusedPlayback =
    focusedResolved && (focusedYoutube || focusedAudio)
      ? { title: focusedResolved.title, youtube: focusedYoutube, audio: focusedAudio }
      : null;

  return (
    <div className={focusedPlayback ? "has-rehearsal-dock" : undefined}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {director ? (
          <form action={updatePlanMetaAction} className="paper-card grid gap-4 rounded-3xl p-5 md:grid-cols-2">
            <input type="hidden" name="id" value={plan.id} />
            <div>
              <label className="field-label">Name</label>
              <input name="name" defaultValue={plan.name} className="field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date</label>
                <input type="date" name="date" defaultValue={plan.date} className="field" />
              </div>
              <div>
                <label className="field-label">Time</label>
                <input name="serviceTime" defaultValue={plan.serviceTime} className="field" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Director notes</label>
              <textarea name="notes" defaultValue={plan.notes} rows={2} className="field" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="btn btn-ghost" type="submit">
                Save details
              </button>
            </div>
          </form>
        ) : plan.notes ? (
          <div className="paper-card rounded-3xl p-5 text-ink-soft">
            <p className="field-label">Director notes</p>
            <p>{plan.notes}</p>
          </div>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="field-label">Order of service</p>
              <h2 className="font-serif text-3xl">Setlist</h2>
            </div>
            <span className="chip">{plan.items.length} items</span>
          </div>

          <ol className="paper-card overflow-hidden rounded-[2rem]">
            {plan.items.map((item, index) => {
              const resolved = resolveItem(item, songs);
              const youtube = hasYouTube(resolved.youtubeUrl) ? resolved.youtubeUrl : "";
              const audio = audioSrc(resolved.audioFilename);
              const playable = Boolean(youtube || audio);
              const focused = focusedId === item.id;
              const meta = setlistMeta(item, resolved);
              return (
                <li
                  key={item.id}
                  className={`border-b border-line/70 last:border-0 ${focused ? "bg-paper" : ""}`}
                >
                  <div className="flex items-start gap-3 px-5 py-4">
                    <button
                      type="button"
                      disabled={!playable}
                      aria-pressed={playable ? focused : undefined}
                      className="flex min-w-0 flex-1 items-baseline gap-4 text-left disabled:cursor-default"
                      onClick={() => setFocusedId(focused ? null : item.id)}
                    >
                      <span className="w-8 shrink-0 text-xs tracking-[0.16em] text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-serif text-xl leading-tight">{resolved.title}</span>
                        <span className="mt-1 block text-sm text-muted">{meta}</span>
                        {playable ? (
                          <span className="mt-2 flex flex-wrap gap-2">
                            {youtube ? <span className="chip">YouTube</span> : null}
                            {audio ? <span className="chip">Audio</span> : null}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    {director ? (
                      <div className="flex shrink-0 gap-1">
                        <form action={movePlanItemAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button className="btn btn-ghost px-3 py-2 text-sm" type="submit" aria-label="Move up">
                            ↑
                          </button>
                        </form>
                        <form action={movePlanItemAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button className="btn btn-ghost px-3 py-2 text-sm" type="submit" aria-label="Move down">
                            ↓
                          </button>
                        </form>
                        <form action={removePlanItemAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button className="btn btn-danger px-3 py-2 text-sm" type="submit" aria-label="Remove">
                            ✕
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                  {resolved.body &&
                  !(director && (item.type === "announcement" || item.type === "sermon" || item.type === "notes")) ? (
                    <p className="px-5 pb-2 pl-[4.25rem] text-sm text-ink-soft">{resolved.body}</p>
                  ) : null}
                  {resolved.song?.notes ? (
                    <p className="px-5 pb-2 pl-[4.25rem] text-sm text-muted">{resolved.song.notes}</p>
                  ) : null}
                  {resolved.song ? (
                    <div className="px-5 pb-4 pl-[4.25rem]">
                      <Link href={`/songs/${resolved.song.id}`} className="text-sm text-wine underline-offset-4 hover:underline">
                        Open in library
                      </Link>
                    </div>
                  ) : null}
                  {director && (item.type === "announcement" || item.type === "sermon" || item.type === "notes") ? (
                    <details className="group px-5 pb-4">
                      <summary className="cursor-pointer text-sm text-wine">{resolved.body || "Add copy"}</summary>
                      <form action={updatePlanItemAction} className="mt-3 space-y-3">
                        <input type="hidden" name="planId" value={plan.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <input name="title" defaultValue={item.title} className="field" />
                        <textarea name="body" defaultValue={item.body} rows={3} className="field" />
                        <button className="btn btn-ghost" type="submit">
                          Update
                        </button>
                      </form>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {director ? (
          <form action={addPlanItemAction} className="paper-card space-y-4 rounded-3xl p-5">
            <p className="field-label">Add to the order</p>
            <input type="hidden" name="planId" value={plan.id} />
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ITEM_LABELS) as PlanItemType[]).map((type) => (
                <label key={type} className={`chip cursor-pointer ${addType === type ? "chip-active" : ""}`}>
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={addType === type}
                    onChange={() => setAddType(type)}
                    className="sr-only"
                  />
                  {ITEM_LABELS[type]}
                </label>
              ))}
            </div>
            {addType === "song" ? (
              <select name="songId" className="field" required>
                <option value="">Choose from the library…</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title} — {song.artist}
                  </option>
                ))}
              </select>
            ) : (
              <input name="title" className="field" placeholder="Title" required={addType !== "sermon"} />
            )}
            {addType === "youtube" ? (
              <input name="youtubeUrl" className="field" placeholder="YouTube URL" required />
            ) : null}
            {addType !== "song" && addType !== "youtube" && addType !== "media" ? (
              <textarea name="body" rows={3} className="field" placeholder="Spoken copy, cues, or notes" />
            ) : null}
            {addType === "media" ? <AudioUploader /> : null}
            <button className="btn btn-primary" type="submit">
              Add item
            </button>
          </form>
        ) : null}
      </div>

      <aside className="space-y-5">
        <div className="paper-card rounded-3xl p-5">
          <p className="field-label">People</p>
          <h2 className="mb-4 font-serif text-2xl">This Sunday</h2>
          <ul className="space-y-3">
            {plan.assignments.map((assignment) => {
              const person = people.find((p) => p.id === assignment.personId);
              const mine = me?.id === assignment.personId;
              const conflictTooltip = director ? assignmentConflicts[assignment.id] : undefined;
              return (
                <li key={assignment.id} className="border-b border-line/70 pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{person?.name ?? "Unknown"}</p>
                      <p className="text-sm text-muted">{assignment.position}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {conflictTooltip ? <ConflictChip tooltip={conflictTooltip} /> : null}
                      <AssignmentStatusChip status={assignment.status} />
                    </div>
                  </div>
                  {mine || director ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AssignmentResponse assignmentId={assignment.id} status={assignment.status} planId={plan.id} />
                      {director ? (
                        <form action={unassignPersonAction}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <button className="btn btn-danger px-3 py-1.5 text-sm" type="submit">
                            Remove
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
            {plan.assignments.length === 0 ? <p className="text-sm text-muted">No one scheduled yet.</p> : null}
          </ul>
        </div>

        {chatOn ? (
          <Link
            href={chatHref({ kind: "plan", planId: plan.id })}
            className="paper-card block rounded-3xl p-5 transition hover:-translate-y-0.5"
          >
            <p className="field-label">Chat</p>
            <h2 className="font-serif text-2xl text-wine-deep">Plan thread</h2>
            <p className="mt-2 text-sm text-ink-soft">Directors and members can post on this Sunday.</p>
          </Link>
        ) : null}

        {director ? (
          <form action={assignPersonAction} className="paper-card space-y-3 rounded-3xl p-5">
            <p className="field-label">Assign a person</p>
            <input type="hidden" name="planId" value={plan.id} />
            <select name="personId" className="field" required>
              <option value="">Choose…</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select name="position" className="field" defaultValue="Vocals">
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <button className="btn btn-primary w-full" type="submit">
              Add to plan
            </button>
          </form>
        ) : null}
      </aside>
      </div>
      {focusedPlayback ? (
        <RehearsalDock
          title={focusedPlayback.title}
          youtubeUrl={focusedPlayback.youtube}
          audio={focusedPlayback.audio}
          onClose={() => setFocusedId(null)}
        />
      ) : null}
    </div>
  );
}

function setlistMeta(
  item: { type: PlanItemType },
  resolved: ReturnType<typeof resolveItem>,
) {
  if (resolved.song) {
    const bits = [resolved.song.artist, resolved.song.key ? `Key ${resolved.song.key}` : ""]
      .filter(Boolean)
      .join(" · ");
    return bits || ITEM_LABELS[item.type];
  }
  return ITEM_LABELS[item.type];
}
