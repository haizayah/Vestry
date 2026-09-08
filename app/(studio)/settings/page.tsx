import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/activity-list";
import { IcalSubscribe } from "@/components/ical-subscribe";
import { LogoUploader } from "@/components/logo-uploader";
import { applyOrgPresetAction, logoutAction, resetDemoAction, rotateIcalTokenAction, updateChurchAction } from "@/lib/actions";
import { visibleActivity } from "@/lib/activity";
import { getSession } from "@/lib/auth";
import { icalFeedPath } from "@/lib/ical";
import { hasModule, moduleSummary, ORG_TYPE_LABELS, roleLabel } from "@/lib/modules";
import { requestOrigin } from "@/lib/origin";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = await readStore();
  const feedUrl = `${await requestOrigin()}${icalFeedPath(store.icalToken)}`;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="field-label">Account</p>
        <h1 className="font-serif text-4xl tracking-tight text-wine-deep">Settings</h1>
      </div>

      <section className="paper-card rounded-3xl p-6">
        <p className="field-label">Signed in as</p>
        <p className="font-serif text-3xl">{session.name}</p>
        <p className="mt-1 text-ink-soft">{session.email}</p>
        <p className="mt-3 chip w-fit">
          {roleLabel(session.role)} · {store.churchName}
        </p>
      </section>

      <section className="paper-card space-y-4 rounded-3xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="field-label">Activity</p>
            <p className="text-ink-soft">Assignments, replies, new events, and chat posts when Chat is on.</p>
          </div>
          <Link href="/activity" className="text-sm text-wine underline-offset-4 hover:underline">
            Open feed
          </Link>
        </div>
        <ActivityList items={visibleActivity(store.activity, store.modules).slice(0, 3)} empty="Nothing logged yet." />
      </section>

      <section className="paper-card space-y-3 rounded-3xl p-6">
        <p className="field-label">Availability</p>
        <p className="text-ink-soft">
          Add dates you’re unavailable. Directors see a gold warning if those overlap a day you’re assigned to.
        </p>
        <Link href="/availability" className="btn btn-ghost">
          Manage blockouts
        </Link>
      </section>

      {session.role === "director" ? (
        <>
          <form action={updateChurchAction} className="paper-card space-y-4 rounded-3xl p-6">
            <p className="field-label">Org</p>
            <input name="churchName" defaultValue={store.churchName} className="field" />
            <p className="text-sm text-ink-soft">
              {ORG_TYPE_LABELS[store.orgType]} · {moduleSummary(store.modules)}
            </p>
            <LogoUploader initialFilename={store.logoFilename} initialDataUrl={store.logoDataUrl} />
            <button className="btn btn-ghost" type="submit">
              Save org
            </button>
          </form>

          <section className="paper-card space-y-3 rounded-3xl p-6">
            <p className="field-label">Modules</p>
            <p className="text-ink-soft">
              Toggle hides nav and routes. Songs, plans, events, chat, and rooms stay saved. Worship, Chat, and
              Resources are optional — Calendar and People stay on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings/modules" className="btn btn-primary">
                Edit modules
              </Link>
              <Link href="/onboarding" className="btn btn-ghost">
                Open onboarding
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <form action={applyOrgPresetAction}>
                <input type="hidden" name="preset" value="sports" />
                <button className="btn btn-ghost" type="submit">
                  Use Harbor FC (Sports)
                </button>
              </form>
              <form action={applyOrgPresetAction}>
                <input type="hidden" name="preset" value="church" />
                <button className="btn btn-ghost" type="submit">
                  Use Harbor Church
                </button>
              </form>
            </div>
            {hasModule(store.modules, "worship") ? null : (
              <p className="text-sm text-muted">Worship is off — Plans and Songs are hidden, not deleted.</p>
            )}
            {hasModule(store.modules, "chat") ? null : (
              <p className="text-sm text-muted">Chat is off — the channel stays hidden until you enable it.</p>
            )}
            {hasModule(store.modules, "resources") ? null : (
              <p className="text-sm text-muted">Resources is off — rooms and gear stay hidden until you enable it.</p>
            )}
          </section>
        </>
      ) : null}

      <section className="paper-card space-y-4 rounded-3xl p-6">
        <p className="field-label">Calendar</p>
        <h2 className="font-serif text-2xl text-wine-deep">iCal subscribe</h2>
        <IcalSubscribe url={feedUrl} />
        {session.role === "director" ? (
          <form action={rotateIcalTokenAction}>
            <button className="btn btn-ghost" type="submit">
              Rotate feed link
            </button>
          </form>
        ) : null}
      </section>

      <section className="paper-card space-y-3 rounded-3xl p-6">
        <p className="field-label">Demo</p>
        <p className="text-ink-soft">
          Harbor Church ships with twelve songs, two Sundays, and a Saturday league series. Resetting restores the original
          seed, issues a new calendar subscribe token, and keeps you signed in.
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
