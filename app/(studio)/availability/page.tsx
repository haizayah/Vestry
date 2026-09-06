import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createLockoutAction, deleteLockoutAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { formatLockoutRange } from "@/lib/lockouts";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const person = store.people.find((entry) => entry.userId === session.id);
  const mine = store.lockouts
    .filter((lockout) => lockout.userId === session.id)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="field-label">Account</p>
        <h1 className="font-serif text-4xl tracking-tight">Availability</h1>
        <p className="mt-3 text-ink-soft">
          Block out dates you’re unavailable. Directors see a warning if those overlap a plan you’re assigned to —
          saving a plan is never blocked.
        </p>
      </div>

      {!person ? (
        <section className="paper-card rounded-3xl p-6 text-ink-soft">
          Ask a director to add you to the roster before you can save blockouts.
        </section>
      ) : (
        <>
          <form action={createLockoutAction} className="paper-card space-y-4 rounded-3xl p-6">
            <p className="field-label">Add blockout</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="start">
                  Start date
                </label>
                <input id="start" name="start" type="date" required className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="end">
                  End date
                </label>
                <input id="end" name="end" type="date" required className="field" />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="note">
                Note <span className="normal-case tracking-normal text-muted">(optional)</span>
              </label>
              <input id="note" name="note" className="field" placeholder="Wedding, travel, out of town…" />
            </div>
            <button className="btn btn-primary w-full" type="submit">
              Save blockout
            </button>
          </form>

          {mine.length === 0 ? (
            <p className="text-ink-soft">No blockouts yet — add dates you’re unavailable.</p>
          ) : (
            <ul className="space-y-3">
              {mine.map((lockout) => (
                <li key={lockout.id} className="paper-card flex items-start justify-between gap-3 rounded-3xl px-5 py-4">
                  <div>
                    <p className="font-serif text-xl">{formatLockoutRange(lockout.start, lockout.end)}</p>
                    {lockout.note ? <p className="mt-1 text-sm text-ink-soft">{lockout.note}</p> : null}
                  </div>
                  <form action={deleteLockoutAction}>
                    <input type="hidden" name="id" value={lockout.id} />
                    <button className="btn btn-danger px-3 py-1.5 text-sm" type="submit">
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}