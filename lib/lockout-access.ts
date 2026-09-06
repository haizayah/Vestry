import type { Lockout, Person, PublicUser, StoreData } from "./types";

export function personOwnedBySession(store: StoreData, session: PublicUser): Person | null {
  return store.people.find((entry) => entry.userId === session.id) ?? null;
}

export function assertOwnsLockout(lockout: Lockout, session: PublicUser, person: Person | null): void {
  if (!person || lockout.userId !== session.id || lockout.personId !== person.id) {
    throw new Error("Forbidden");
  }
}

export function lockoutsOwnedBySession(
  lockouts: Lockout[],
  session: PublicUser,
  person: Person | null,
): Lockout[] {
  if (!person) return [];
  return lockouts.filter((lockout) => lockout.userId === session.id && lockout.personId === person.id);
}

/** Directors may read every lockout to compute warnings. Members see only their own. Never used for writes. */
export function lockoutsReadableForConflicts(lockouts: Lockout[], session: PublicUser, person: Person | null): Lockout[] {
  if (session.role === "director") return lockouts;
  return lockoutsOwnedBySession(lockouts, session, person);
}

export function bindLockoutOwner(session: PublicUser, person: Person): Pick<Lockout, "personId" | "userId"> {
  return { personId: person.id, userId: session.id };
}
