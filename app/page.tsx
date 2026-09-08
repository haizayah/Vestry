import Link from "next/link";
import { GothicArch } from "@/components/gothic-arch";
import { VestryMark } from "@/components/mark";
import { getSession } from "@/lib/auth";

const FEATURES = [
  {
    kicker: "Library",
    title: "Every song, ready to rehearse.",
    body: "Title, key, tempo, notes — plus YouTube and uploaded audio that play without leaving Vestry.",
  },
  {
    kicker: "Sunday",
    title: "Setlists that feel like a service.",
    body: "Songs, announcements, sermon, media, and notes in one order of service. Reorder until it breathes.",
  },
  {
    kicker: "People",
    title: "A light schedule, not a second HR tool.",
    body: "Assign positions. Members accept or decline. Everyone opens the same plan and practices in-app.",
  },
];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-full" data-brand="vestry">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <VestryMark />
        <div className="flex items-center gap-3">
          <Link href={session ? "/home" : "/login"} className="btn btn-ghost hidden sm:inline-flex">
            {session ? "Open studio" : "Sign in"}
          </Link>
          <Link href={session ? "/home" : "/login"} className="btn btn-primary">
            {session ? "Continue" : "Enter the room"}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-20 pt-10 md:pt-20">
          <GothicArch
            variant="line"
            className="pointer-events-none absolute -right-[12%] -top-10 h-[min(92vw,38rem)] w-[min(92vw,38rem)] text-wine/[0.1]"
          />
          <div className="relative max-w-4xl">
            <p className="enter mb-6 text-[0.72rem] uppercase tracking-[0.22em] text-gold">
              Harbor Church · demo inside
            </p>
            <h1 className="enter enter-delay-1 font-serif text-5xl leading-[1.04] tracking-tight text-ink sm:text-7xl">
              Sunday takes shape in the quiet room.
            </h1>
            <p className="enter enter-delay-2 mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
              Vestry is worship planning for directors and teams: a song library, an order of service, and rehearsal that
              stays in the room — YouTube and your own audio, played in-app.
            </p>
            <div className="enter enter-delay-3 mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">
                Plan this Sunday
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Open Harbor Church demo
              </Link>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 pb-24">
          <GothicArch
            variant="line"
            className="pointer-events-none absolute left-1/2 top-[-22%] h-[min(78vw,42rem)] w-[min(94vw,52rem)] -translate-x-1/2 text-wine/[0.13]"
          />
          <div className="paper-card relative overflow-hidden rounded-[2rem]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-line p-7 md:p-11 lg:border-b-0 lg:border-r">
                <p className="field-label">Sunday Gathering · Sep 13</p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight">Order of service</h2>
                <ol className="mt-8 space-y-4">
                  {[
                    ["01", "How Great Is Our God", "Key C · YouTube ready"],
                    ["02", "Goodness of God", "Key G · Audio + YouTube"],
                    ["03", "Welcome & peace", "Announcement"],
                    ["04", "Holy Forever", "Key Db · In-app watch"],
                  ].map(([n, title, meta]) => (
                    <li key={n} className="flex items-baseline gap-4 border-b border-line/70 pb-4 last:border-0 last:pb-0">
                      <span className="w-8 text-xs tracking-[0.16em] text-muted">{n}</span>
                      <div>
                        <p className="font-serif text-xl">{title}</p>
                        <p className="text-sm text-muted">{meta}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="relative overflow-hidden bg-wine-deep p-7 text-on-deep md:p-11">
                <GothicArch
                  variant="line"
                  className="pointer-events-none absolute -right-10 -bottom-16 h-64 w-64 text-gold/20"
                />
                <div className="relative">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-gold">Media readiness</p>
                  <p className="mt-4 font-serif text-4xl leading-tight">Rehearse without leaving the vestry.</p>
                  <p className="mt-4 text-on-deep/70">
                    Directors upload the set. Members open the plan on a phone in the green room and press play.
                  </p>
                  <div className="mt-8 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-3">
                      <span>Songs with YouTube</span>
                      <span>7 / 12</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-3">
                      <span>Uploaded audio</span>
                      <span>Ready</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team responses</span>
                      <span>4 accepted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="paper-card rounded-3xl p-7">
                <p className="field-label">{feature.kicker}</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight tracking-tight">{feature.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-wine-deep px-6 py-14 text-on-deep md:px-12">
            <GothicArch
              variant="line"
              className="pointer-events-none absolute -left-16 -top-20 h-80 w-80 text-gold/15"
            />
            <div className="relative">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-gold">Not another purple dashboard</p>
              <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight md:text-5xl">
                Built for the hour before the room fills.
              </h2>
              <p className="mt-4 max-w-xl text-on-deep/70">
                No giving, no check-ins, no groups product. Vestry is the planning center for worship — songs, Sunday, and
                the people who will stand on the platform.
              </p>
              <Link href="/login" className="btn btn-gold mt-9">
                Use the Harbor Church demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-10 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <VestryMark layout="stacked" />
          <p className="max-w-sm sm:text-right">A worship planning MVP. Demo accounts persist your session.</p>
        </div>
      </footer>
    </div>
  );
}
