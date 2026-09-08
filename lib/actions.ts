"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, requireRole, requireSession, setSessionCookie, toPublicUser } from "./auth";
import { recordActivity } from "./activity";
import { chatHref, threadTitle } from "./chat";
import { hasModule, DEFAULT_CHURCH_MODULES, DEFAULT_SPORTS_MODULES, isOrgType, normalizeModules } from "./modules";
import { parseRecurrenceFromForm } from "./recurrence";
import { isResourceKind, parseBookingTarget, resolveBookingSlot } from "./resources";
import { newId, readStore, resetStore, updateStore } from "./store";
import type { Assignment, AssignmentStatus, ChatThreadKind, Event, PlanItem, PlanItemType } from "./types";

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
  const director = await requireRole("director");
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
    recordActivity(store, {
      kind: "plan",
      actorUserId: director.id,
      actorName: director.name,
      summary: `${director.name} created ${plan.name}`,
      href: `/plans/${plan.id}`,
    });
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
    // Warn-only: lockout overlap on the (possibly new) date never rejects this write.
  });
  refreshApp();
}

export async function deletePlanAction(formData: FormData) {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.plans = store.plans.filter((p) => p.id !== id);
    store.bookings = store.bookings.filter((booking) => booking.planId !== id);
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
  const director = await requireRole("director");
  const planId = String(formData.get("planId") || "");
  const personId = String(formData.get("personId") || "");
  const position = String(formData.get("position") || "Vocals");
  await updateStore((store) => {
    const plan = store.plans.find((p) => p.id === planId);
    const person = store.people.find((p) => p.id === personId);
    if (!plan) throw new Error("Plan not found");
    if (!person) throw new Error("Person not found");
    if (plan.assignments.some((a) => a.personId === personId && a.position === position)) return;
    // Warn-only: a lockout covering plan.date must not block assign.
    plan.assignments.push({
      id: newId("as"),
      personId,
      position,
      status: "pending",
    });
    recordActivity(store, {
      kind: "assigned",
      actorUserId: director.id,
      actorName: director.name,
      summary: `${director.name} assigned ${person.name} as ${position} on ${plan.name}`,
      href: `/plans/${plan.id}`,
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
    const assigned = store.people.find((entry) => entry.id === assignment.personId);
    recordActivity(store, {
      kind: status === "accepted" ? "accepted" : "declined",
      actorUserId: session.id,
      actorName: session.name,
      summary: `${assigned?.name ?? session.name} ${status} ${assignment.position} on ${plan.name}`,
      href: `/plans/${plan.id}`,
    });
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
  const name = String(formData.get("churchName") || formData.get("orgName") || "").trim();
  const logo = String(formData.get("logoFilename") || "");
  await updateStore((store) => {
    if (name) store.churchName = name;
    if (formData.get("clearLogo") === "on") {
      store.logoFilename = null;
    } else if (logo) {
      store.logoFilename = logo;
    }
  });
  refreshApp();
}

export async function rotateIcalTokenAction(): Promise<void> {
  await requireRole("director");
  await updateStore((store) => {
    store.icalToken = newId("ical");
  });
  refreshApp();
}

export async function updateOrgAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const name = String(formData.get("churchName") || formData.get("orgName") || "").trim();
  const orgTypeRaw = String(formData.get("orgType") || "");
  const modules = formData.getAll("modules").map(String);
  await updateStore((store) => {
    if (name) store.churchName = name;
    if (isOrgType(orgTypeRaw)) store.orgType = orgTypeRaw;
    store.modules = normalizeModules(modules);
    // Toggle hides nav/routes only — songs, plans, and events stay on disk.
  });
  refreshApp();
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  await updateOrgAction(formData);
  redirect("/home");
}

export async function applyOrgPresetAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const preset = String(formData.get("preset") || "");
  await updateStore((store) => {
    if (preset === "sports") {
      store.churchName = "Harbor FC";
      store.orgType = "sports";
      store.modules = normalizeModules(DEFAULT_SPORTS_MODULES);
      return;
    }
    store.churchName = "Harbor Church";
    store.orgType = "church";
    store.modules = normalizeModules(DEFAULT_CHURCH_MODULES);
  });
  refreshApp();
}

export async function createEventAction(formData: FormData): Promise<void> {
  const director = await requireRole("director");
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  if (!title || !date) return;

  const id = await updateStore((store) => {
    const event: Event = {
      id: newId("event"),
      title,
      date,
      time: String(formData.get("time") || "10:00 AM").trim(),
      location: String(formData.get("location") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      recurrence: parseRecurrenceFromForm(formData),
      assignments: [],
      createdAt: new Date().toISOString(),
    };
    store.events.push(event);
    store.events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    recordActivity(store, {
      kind: event.recurrence ? "series" : "event",
      actorUserId: director.id,
      actorName: director.name,
      summary: event.recurrence
        ? `${director.name} created ${event.title} (${event.recurrence.freq} series)`
        : `${director.name} created ${event.title}`,
      href: `/events/${event.id}`,
    });
    // Warn-only: lockout overlap on any occurrence never rejects this write.
    return event.id;
  });

  refreshApp();
  redirect(`/events/${id}`);
}

export async function updateEventAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    const event = store.events.find((entry) => entry.id === id);
    if (!event) throw new Error("Event not found");
    event.title = String(formData.get("title") || "").trim() || event.title;
    event.date = String(formData.get("date") || event.date);
    event.time = String(formData.get("time") || event.time).trim();
    event.location = String(formData.get("location") || "").trim();
    event.notes = String(formData.get("notes") || "").trim();
    if (formData.has("repeat")) {
      event.recurrence = parseRecurrenceFromForm(formData);
    }
    // Warn-only: lockout overlap on the (possibly new) series never rejects this write.
  });
  refreshApp();
}

export async function deleteEventAction(formData: FormData) {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.events = store.events.filter((entry) => entry.id !== id);
    store.bookings = store.bookings.filter((booking) => booking.eventId !== id);
  });
  refreshApp();
  redirect("/events");
}

export async function assignEventPersonAction(formData: FormData) {
  const director = await requireRole("director");
  const eventId = String(formData.get("eventId") || "");
  const personId = String(formData.get("personId") || "");
  const position = String(formData.get("position") || "Member");
  await updateStore((store) => {
    const event = store.events.find((entry) => entry.id === eventId);
    const person = store.people.find((entry) => entry.id === personId);
    if (!event) throw new Error("Event not found");
    if (!person) throw new Error("Person not found");
    if (event.assignments.some((row) => row.personId === personId && row.position === position)) return;
    // Warn-only: a lockout covering an occurrence must not block assign.
    event.assignments.push({
      id: newId("as"),
      personId,
      position,
      status: "pending",
    });
    recordActivity(store, {
      kind: "assigned",
      actorUserId: director.id,
      actorName: director.name,
      summary: `${director.name} assigned ${person.name} as ${position} on ${event.title}`,
      href: `/events/${event.id}`,
    });
  });
  refreshApp();
}

export async function unassignEventPersonAction(formData: FormData) {
  await requireRole("director");
  const eventId = String(formData.get("eventId") || "");
  const assignmentId = String(formData.get("assignmentId") || "");
  await updateStore((store) => {
    const event = store.events.find((entry) => entry.id === eventId);
    if (!event) throw new Error("Event not found");
    event.assignments = event.assignments.filter((row) => row.id !== assignmentId);
  });
  refreshApp();
}

export async function respondEventAssignmentAction(formData: FormData) {
  const session = await requireSession();
  const eventId = String(formData.get("eventId") || "");
  const assignmentId = String(formData.get("assignmentId") || "");
  const status = String(formData.get("status") || "") as AssignmentStatus;
  if (status !== "accepted" && status !== "declined") {
    throw new Error("Invalid response");
  }
  await updateStore((store) => {
    const person = store.people.find((entry) => entry.userId === session.id);
    const event = store.events.find((entry) => entry.id === eventId);
    const assignment = event?.assignments.find((row) => row.id === assignmentId);
    if (!event || !assignment) throw new Error("Assignment not found");
    if (session.role !== "director" && assignment.personId !== person?.id) {
      throw new Error("Forbidden");
    }
    assignment.status = status;
    const assigned = store.people.find((entry) => entry.id === assignment.personId);
    recordActivity(store, {
      kind: status === "accepted" ? "accepted" : "declined",
      actorUserId: session.id,
      actorName: session.name,
      summary: `${assigned?.name ?? session.name} ${status} ${assignment.position} on ${event.title}`,
      href: `/events/${event.id}`,
    });
  });
  refreshApp();
}

export async function postChatAction(formData: FormData) {
  const session = await requireSession();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const threadKind = String(formData.get("threadKind") || "team") as ChatThreadKind;
  if (threadKind !== "team" && threadKind !== "plan" && threadKind !== "event") {
    throw new Error("Invalid thread");
  }
  const planId = String(formData.get("planId") || "") || undefined;
  const eventId = String(formData.get("eventId") || "") || undefined;

  await updateStore((store) => {
    if (!hasModule(store.modules, "chat")) throw new Error("Chat is off");
    if (threadKind === "plan") {
      if (!planId || !store.plans.some((plan) => plan.id === planId)) throw new Error("Plan not found");
    }
    if (threadKind === "event") {
      if (!eventId || !store.events.some((event) => event.id === eventId)) throw new Error("Event not found");
    }
    store.messages.push({
      id: newId("msg"),
      threadKind,
      planId: threadKind === "plan" ? planId : undefined,
      eventId: threadKind === "event" ? eventId : undefined,
      authorUserId: session.id,
      body: body.slice(0, 2000),
      createdAt: new Date().toISOString(),
    });
    const title = threadTitle(store, { kind: threadKind, planId, eventId });
    recordActivity(store, {
      kind: "chat",
      actorUserId: session.id,
      actorName: session.name,
      summary: `${session.name} posted in ${title}`,
      href: chatHref({ kind: threadKind, planId, eventId }),
    });
  });
  refreshApp();
}

export async function createResourceAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const name = String(formData.get("name") || "").trim();
  const kindRaw = String(formData.get("kind") || "room");
  if (!name || !isResourceKind(kindRaw)) return;
  await updateStore((store) => {
    if (!hasModule(store.modules, "resources")) throw new Error("Resources is off");
    store.resources.push({
      id: newId("res"),
      name,
      kind: kindRaw,
      notes: String(formData.get("notes") || "").trim(),
    });
    store.resources.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  });
  refreshApp();
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.resources = store.resources.filter((resource) => resource.id !== id);
    store.bookings = store.bookings.filter((booking) => booking.resourceId !== id);
  });
  refreshApp();
}

export async function bookResourceAction(formData: FormData): Promise<void> {
  const director = await requireRole("director");
  const resourceId = String(formData.get("resourceId") || "");
  const notes = String(formData.get("notes") || "").trim();
  const target = parseBookingTarget(String(formData.get("target") || ""));
  if (!resourceId || !target) return;

  await updateStore((store) => {
    if (!hasModule(store.modules, "resources")) throw new Error("Resources is off");
    const resource = store.resources.find((entry) => entry.id === resourceId);
    if (!resource) throw new Error("Resource not found");
    const slot = resolveBookingSlot(store, target);
    if (!slot) throw new Error("Slot not found");
    // Warn-only: a double-book on the same date never rejects this write.
    const booking = {
      id: newId("book"),
      resourceId,
      eventId: slot.event?.id,
      planId: slot.plan?.id,
      date: slot.date,
      notes,
      createdAt: new Date().toISOString(),
    };
    store.bookings.push(booking);
    const title = slot.plan?.name ?? slot.event?.title ?? "a slot";
    recordActivity(store, {
      kind: "booking",
      actorUserId: director.id,
      actorName: director.name,
      summary: `${director.name} booked ${resource.name} for ${title}`,
      href: slot.plan ? `/plans/${slot.plan.id}` : `/events/${slot.event?.id}`,
    });
  });
  refreshApp();
}

export async function unbookResourceAction(formData: FormData): Promise<void> {
  await requireRole("director");
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    store.bookings = store.bookings.filter((booking) => booking.id !== id);
  });
  refreshApp();
}

function findAssignment(
  store: { plans: { id: string; assignments: Assignment[] }[]; events: { id: string; assignments: Assignment[] }[] },
  planId: string,
  eventId: string,
  assignmentId: string,
): Assignment | undefined {
  if (planId) {
    return store.plans.find((plan) => plan.id === planId)?.assignments.find((row) => row.id === assignmentId);
  }
  if (eventId) {
    return store.events.find((event) => event.id === eventId)?.assignments.find((row) => row.id === assignmentId);
  }
  return undefined;
}

export async function toggleReminderAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const planId = String(formData.get("planId") || "");
  const eventId = String(formData.get("eventId") || "");
  const assignmentId = String(formData.get("assignmentId") || "");
  const next = String(formData.get("reminder") || "") === "on";

  await updateStore((store) => {
    const person = store.people.find((entry) => entry.userId === session.id);
    const assignment = findAssignment(store, planId, eventId, assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    if (session.role !== "director" && assignment.personId !== person?.id) {
      throw new Error("Forbidden");
    }
    assignment.reminder = next;
    const host = planId
      ? store.plans.find((plan) => plan.id === planId)
      : store.events.find((event) => event.id === eventId);
    const assigned = store.people.find((entry) => entry.id === assignment.personId);
    const title = host && "name" in host ? host.name : host && "title" in host ? host.title : "an assignment";
    if (next) {
      recordActivity(store, {
        kind: "reminder",
        actorUserId: session.id,
        actorName: session.name,
        summary: `${session.name} flagged a reminder for ${assigned?.name ?? "someone"} on ${title}`,
        href: planId ? `/plans/${planId}` : `/events/${eventId}`,
      });
    }
  });
  refreshApp();
}

