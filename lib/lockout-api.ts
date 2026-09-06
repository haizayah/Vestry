"use server";

/**
 * Lockout API (Security review surface).
 *
 * Mutations bind personId + userId from the signed session only. Form fields
 * named personId / userId are ignored. Directors cannot create, update, or
 * delete another person's lockouts.
 *
 * listOwnLockouts is owner-only. listLockoutsForConflictRead / conflict
 * compute are read paths: directors see all rows; members see their own.
 * Plan and assignment writes never throw because of a lockout overlap.
 */

import { revalidatePath } from "next/cache";
import { requireSession } from "./auth";
import type { CalendarPlan } from "./calendar";
import {
  assertOwnsLockout,
  bindLockoutOwner,
  lockoutsOwnedBySession,
  lockoutsReadableForConflicts,
  personOwnedBySession,
} from "./lockout-access";
import {
  conflictsForPlan,
  isISODate,
  lockoutTooltip,
  lockoutsForPersonOnDate,
} from "./lockouts";
import { newId, readStore, updateStore } from "./store";
import type { Lockout } from "./types";

function refreshApp() {
  revalidatePath("/", "layout");
}

function parseRange(formData: FormData): { start: string; end: string; note: string } | null {
  const start = String(formData.get("start") || "").trim();
  const end = String(formData.get("end") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!isISODate(start) || !isISODate(end) || end < start) return null;
  return { start, end, note };
}

/** Availability list — always the session user's rows, including directors. */
export async function listOwnLockouts(): Promise<Lockout[]> {
  const session = await requireSession();
  const store = await readStore();
  const person = personOwnedBySession(store, session);
  return lockoutsOwnedBySession(store.lockouts, session, person).sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
}

/**
 * Director-only read of all lockouts for warn-only conflict badges.
 * Members receive only their own. This function never writes.
 */
export async function listLockoutsForConflictRead(): Promise<Lockout[]> {
  const session = await requireSession();
  const store = await readStore();
  const person = personOwnedBySession(store, session);
  return lockoutsReadableForConflicts(store.lockouts, session, person);
}

export async function createLockoutAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const range = parseRange(formData);
  if (!range) return;

  await updateStore((store) => {
    const person = personOwnedBySession(store, session);
    if (!person) throw new Error("Forbidden");
    const owner = bindLockoutOwner(session, person);
    store.lockouts.push({
      id: newId("lock"),
      personId: owner.personId,
      userId: owner.userId,
      start: range.start,
      end: range.end,
      note: range.note,
      createdAt: new Date().toISOString(),
    });
  });
  refreshApp();
}

export async function updateLockoutAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  const range = parseRange(formData);
  if (!id || !range) return;

  await updateStore((store) => {
    const lockout = store.lockouts.find((entry) => entry.id === id);
    if (!lockout) throw new Error("Lockout not found");
    const person = personOwnedBySession(store, session);
    assertOwnsLockout(lockout, session, person);
    if (!person) throw new Error("Forbidden");
    const owner = bindLockoutOwner(session, person);
    lockout.personId = owner.personId;
    lockout.userId = owner.userId;
    lockout.start = range.start;
    lockout.end = range.end;
    lockout.note = range.note;
  });
  refreshApp();
}

export async function deleteLockoutAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  await updateStore((store) => {
    const lockout = store.lockouts.find((entry) => entry.id === id);
    if (!lockout) throw new Error("Lockout not found");
    const person = personOwnedBySession(store, session);
    assertOwnsLockout(lockout, session, person);
    store.lockouts = store.lockouts.filter((entry) => entry.id !== id);
  });
  refreshApp();
}

/** Server-side conflict map for the plan Team panel. Directors only; empty for members. */
export async function computeAssignmentConflicts(planId: string): Promise<Record<string, string>> {
  const session = await requireSession();
  if (session.role !== "director") return {};
  const store = await readStore();
  const plan = store.plans.find((entry) => entry.id === planId);
  if (!plan) return {};
  const person = personOwnedBySession(store, session);
  const lockouts = lockoutsReadableForConflicts(store.lockouts, session, person);
  const result: Record<string, string> = {};
  for (const assignment of plan.assignments) {
    const hits = lockoutsForPersonOnDate(lockouts, assignment.personId, plan.date);
    if (hits.length) result[assignment.id] = lockoutTooltip(hits);
  }
  return result;
}

/** Server-side calendar payloads. Conflict rows are computed here, not in the client. */
export async function loadCalendarPlans(): Promise<CalendarPlan[]> {
  const session = await requireSession();
  const store = await readStore();
  const person = personOwnedBySession(store, session);
  const lockouts = lockoutsReadableForConflicts(store.lockouts, session, person);
  return store.plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    date: plan.date,
    serviceTime: plan.serviceTime,
    assigned: person ? plan.assignments.some((row) => row.personId === person.id) : false,
    conflicts: conflictsForPlan(plan, lockouts, store.people),
  }));
}
