import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction, resetDemoAction, updateChurchAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="field-label">Account</p>
        <h1 className="font-serif text-4xl">Settings</h1>
      </div>

      <section className="paper-card rounded-3xl p-6">
        <p className="field-label">Signed in as</p>
        <p className="font-serif text-3xl">{session.name}</p>
        <p className="mt-1 text-ink-soft">{session.email}</p>
        <p className="mt-3 chip w-fit">{session.role === "director" ? "Music director" : "Team member"}</p>
      </section>

      {session.role === "director" ? (
        <form action={updateChurchAction} className="paper-card space-y-4 rounded-3xl p-6">
          <p className="field-label">Church</p>
          <input name="churchName" defaultValue={store.churchName} className="field" />
          <button className="btn btn-ghost" type="submit">
            Save church name
          </button>
        </form>
      ) : null}

      <section className="paper-card space-y-3 rounded-3xl p-6">
        <p className="field-label">Demo</p>
        <p className="text-ink-soft">
          Harbor Church ships with twelve songs and two Sundays. Resetting restores the original seed and keeps you
          signed in.
        </p>
        {session.role === "director" ? (
          <form action={resetDemoAction}>
            <button className="btn btn-ghost" type="submit">
              Reset demo data
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">Ask a director if the room needs a reset.</p>
        )}
      </section>

      <form action={logoutAction}>
        <button className="btn btn-danger" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
