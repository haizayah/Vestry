"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, requireRole, requireSession, setSessionCookie, toPublicUser } from "./auth";
import { isISODate } from "./lockouts";
import { newId, readStore, resetStore, updateStore } from "./store";
import type { AssignmentStatus, PlanItem, PlanItemType } from "./types";

function refreshApp() {
  revalidatePath("/", "layout");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const store = await readStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email && u.password === password);
  if (!user) {
    return { error: "Those credentials aren’t in the vestry." };
  }
  await setSessionCookie(toPublicUser(user));
  redirect("/home");
}

export async function demoLoginAction(email: string): Promise<void> {
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user) return;
  await setSessionCookie(toPublicUser(user));
  redirect("/home");
}

export async function demoDirectorLoginAction(): Promise<void> {
  await demoLoginAction("director@harbor.church");
}

export async function demoMemberLoginAction(): Promise<void> {
  await demoLoginAction("member@harbor.church");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function resetDemoAction() {
  await requireRole("director");
  await resetStore();
  refreshApp();
}

export async function createSongAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  const id = await updateStore((store) => {
    const now = new Date().toISOString();
    const song = {
      id: newId("song"),
      title,
      artist: String(formData.get("artist") || "").trim(),
      key: String(formData.get("key") || "").trim(),
      tempo: formData.get("tempo") ? Number(formData.get("tempo")) : null,
      notes: String(formData.get("notes") || "").trim(),
      youtubeUrl: String(formData.get("youtubeUrl") || "").trim(),
      audioFilename: String(formData.get("audioFilename") || "") || null,
      createdAt: now,
      updatedAt: now,
    };
    store.songs.unshift(song);
    return song.id;
  });

  refreshApp();
  redirect(`/songs/${id}`);
}

export async function updateSongAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    const song = store.songs.find((s) => s.id === id);
    if (!song) throw new Error("Song not found");
    song.title = String(formData.get("title") || "").trim() || song.title;
    song.artist = String(formData.get("artist") || "").trim();
    song.key = String(formData.get("key") || "").trim();
    song.tempo = formData.get("tempo") ? Number(formData.get("tempo")) : null;
    song.notes = String(formData.get("notes") || "").trim();
    song.youtubeUrl = String(formData.get("youtubeUrl") || "").trim();
    const audio = String(formData.get("audioFilename") || "");
    if (formData.get("clearAudio") === "on") {
      song.audioFilename = null;
    } else if (audio) {
      song.audioFilename = audio;
    }
    song.updatedAt = new Date().toISOString();
  });
  refreshApp();
  redirect(`/songs/${id}`);
}

export async function deleteSongAction(formData: FormData) {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.songs = store.songs.filter((s) => s.id !== id);
    for (const plan of store.plans) {
      plan.items = plan.items.filter((item) => item.songId !== id);
    }
  });
  refreshApp();
  redirect("/songs");
}

export async function createPlanAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const name = String(formData.get("name") || "").trim() || "Sunday Gathering";
  const date = String(formData.get("date") || "");
  if (!date) return;

  const id = await updateStore((store) => {
    const plan = {
      id: newId("plan"),
      name,
      date,
      serviceTime: String(formData.get("serviceTime") || "10:00 AM").trim(),
      notes: String(formData.get("notes") || "").trim(),
      items: [] as PlanItem[],
      assignments: [],
      createdAt: new Date().toISOString(),
    };
    store.plans.push(plan);
    store.plans.sort((a, b) => a.date.localeCompare(b.date));
    return plan.id;
  });

  refreshApp();
  redirect(`/plans/${id}`);
}

export async function updatePlanMetaAction(formData: FormData) {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === id);
    if (!plan) throw new Error("Plan not found");
    plan.name = String(formData.get("name") || "").trim() || plan.name;
    plan.date = String(formData.get("date") || plan.date);
    plan.serviceTime = String(formData.get("serviceTime") || plan.serviceTime).trim();
    plan.notes = String(formData.get("notes") || "").trim();
  });
  refreshApp();
}

export async function deletePlanAction(formData: FormData) {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.plans = store.plans.filter((p) => p.id !== id);
  });
  refreshApp();
  redirect("/plans");
}

export async function addPlanItemAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const type = String(formData.get("type") || "notes") as PlanItemType;
  const songId = String(formData.get("songId") || "") || undefined;

  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    const song = songId ? store.songs.find((s) => s.id === songId) : undefined;
    const item: PlanItem = {
      id: newId("item"),
      type,
      title:
        String(formData.get("title") || "").trim() ||
        song?.title ||
        (type === "sermon" ? "Sermon" : type === "announcement" ? "Announcement" : "Notes"),
      songId,
      youtubeUrl: String(formData.get("youtubeUrl") || "").trim() || undefined,
      audioFilename: String(formData.get("audioFilename") || "") || undefined,
      body: String(formData.get("body") || "").trim() || undefined,
    };
    plan.items.push(item);
  });
  refreshApp();
}

export async function updatePlanItemAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const itemId = String(formData.get("itemId") || "");
  await updateStore((store) => {
    const item = store.plans.find((p) => p.id === planId)?.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    const title = String(formData.get("title") || "").trim();
    if (title) item.title = title;
    const body = String(formData.get("body") || "");
    if (formData.has("body")) item.body = body.trim() || undefined;
    const youtubeUrl = String(formData.get("youtubeUrl") || "");
    if (formData.has("youtubeUrl")) item.youtubeUrl = youtubeUrl.trim() || undefined;
  });
  refreshApp();
}

export async function removePlanItemAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const itemId = String(formData.get("itemId") || "");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    plan.items = plan.items.filter((i) => i.id !== itemId);
  });
  refreshApp();
}

export async function movePlanItemAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const itemId = String(formData.get("itemId") || "");
  const direction = String(formData.get("direction") || "");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    const index = plan.items.findIndex((i) => i.id === itemId);
    if (index < 0) return;
    const next = direction === "up" ? index - 1 : index + 1;
    if (next < 0 || next >= plan.items.length) return;
    const copy = [...plan.items];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    plan.items = copy;
  });
  refreshApp();
}

export async function reorderPlanItemsAction(planId: string, orderedIds: string[]) {
  await requireRole("director");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    const map = new Map(plan.items.map((i) => [i.id, i]));
    const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as PlanItem[];
    for (const item of plan.items) {
      if (!orderedIds.includes(item.id)) next.push(item);
    }
    plan.items = next;
  });
  refreshApp();
}

export async function assignPersonAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const personId = String(formData.get("personId") || "");
  const position = String(formData.get("position") || "Vocals");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    if (!store.people.some((p) => p.id === personId)) throw new Error("Person not found");
    if (plan.assignments.some((a) => a.personId === personId && a.position === position)) return;
    plan.assignments.push({
      id: newId("as"),
      personId,
      position,
      status: "pending",
    });
  });
  refreshApp();
}

export async function unassignPersonAction(formData: FormData) {
  await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const assignmentId = String(formData.get("assignmentId") || "");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("Plan not found");
    plan.assignments = plan.assignments.filter((a) => a.id !== assignmentId);
  });
  refreshApp();
}

export async function respondAssignmentAction(formData: FormData) {
  const session = await requireSession();
  const planId = String(formData.get("planId") || "");
  const assignmentId = String(formData.get("assignmentId") || "");
  const status = String(formData.get("status") || "") as AssignmentStatus;
  if (status !== "accepted" && status !== "declined") {
    throw new Error("Invalid response");
  }
  await updateStore((store) => {
    const person = store.people.find((p) => p.userId === session.id);
    const plan = store.plans.find((p) => p.id === planId);
    const assignment = plan?.assignments.find((a) => a.id === assignmentId);
    if (!plan || !assignment) throw new Error("Assignment not found");
    if (session.role !== "director" && assignment.personId !== person?.id) {
      throw new Error("Forbidden");
    }
    assignment.status = status;
  });
  refreshApp();
}

export async function addPersonAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await updateStore((store) => {
    store.people.push({
      id: newId("person"),
      name,
      email: String(formData.get("email") || "").trim(),
      defaultPosition: String(formData.get("defaultPosition") || "Vocals").trim(),
    });
  });
  refreshApp();
}

export async function updateChurchAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const name = String(formData.get("churchName") || "").trim();
  if (!name) return;
  await updateStore((store) => {
    store.churchName = name;
  });
  refreshApp();
}

export async function createLockoutAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const start = String(formData.get("start") || "").trim();
  const end = String(formData.get("end") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!isISODate(start) || !isISODate(end) || end < start) return;

  await updateStore((store) => {
    const person = store.people.find((entry) => entry.userId === session.id);
    if (!person) throw new Error("Forbidden");
    store.lockouts.push({
      id: newId("lock"),
      personId: person.id,
      userId: session.id,
      start,
      end,
      note,
      createdAt: new Date().toISOString(),
    });
  });
  refreshApp();
}

export async function deleteLockoutAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    const lockout = store.lockouts.find((entry) => entry.id === id);
    if (!lockout) throw new Error("Lockout not found");
    const person = store.people.find((entry) => entry.userId === session.id);
    if (lockout.userId !== session.id || lockout.personId !== person?.id) {
      throw new Error("Forbidden");
    }
    store.lockouts = store.lockouts.filter((entry) => entry.id !== id);
  });
  refreshApp();
}
