# Vestry

A calm planning studio for directors and teams. Orgs pick a type and modules — Church + Worship stays the Harbor demo; Sports-style (Worship off) uses events, schedule, and people instead of setlists.

Harbor Church ships as a demo so you can walk the full Sunday workflow, then toggle modules in Settings.

## What it is

Vestry is an upgraded, editorial take on Planning Center Services — not a full church OS. It is for the hour before the room fills.

**In this MVP**

- Marketing landing at `/`
- Demo auth with persisted session (director + member)
- Org type + modules (Calendar and People always on; Worship optional). Directors toggle in Settings → Modules
- Module-aware shell: desktop sidebar + mobile dock / More. Plans and Songs hide when Worship is off (data stays)
- Calendar month and week shells, plus member blockouts and warn-only assignment conflicts
- Events with recurring create (weekly / biweekly / monthly). Occurrences expand server-side
- Schedule home for assignments; Availability lockouts from #9
- People roster at `/people` and `/people/[id]`
- Adaptive Home: plan/media cards when Worship is on; event/assignment cards when off
- Song library CRUD and service plans when Worship is on
- YouTube and uploaded audio play **in-app** on song and plan pages

**Out of scope**

Chat, Resources, Giving, Check-ins, leads depth, auto-scheduler, CCLI, native apps, Spotify/Apple Music APIs.

## Stack

Next.js App Router (v16), TypeScript, Tailwind CSS v4. Data lives in a JSON store under `data/` plus uploaded audio files. No database required.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Music director | `director@harbor.church` | `vestry` |
| Team member | `member@harbor.church` | `vestry` |

Session is an HTTP-only cookie (30 days). The login page also has one-click demo buttons.

## Seed data (Harbor Church)

- 12 songs (several with YouTube; *Goodness of God* includes a short rehearsal WAV)
- 2 upcoming plans: **Sunday Gathering** (Sep 13, 2026) and **Harbor Sunday** (Sep 20, 2026)
- A Saturday League Match event series (weekly × 12) for the Events module
- A seven-person roster with assignments already on the plans and the league match

Jordan Ellis (member) has a pending invite on Sep 13, an accepted seat on Sep 20, and a seeded blockout Sep 12–14 (warn-only conflict on Sunday Gathering).

## Getting started

```bash
cp .env.example .env.local   # optional
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

`npm run seed:audio` regenerates `data/uploads/harbor-rehearsal.wav` if you delete it.

## Environment

See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs the session cookie. **Required in production** — Vercel must set this or the app fails closed. Local/dev may omit it and will use a documented insecure default. |

Runtime data:

- Locally: `data/store.json` (created from seed on first read; gitignored) and `data/uploads/`
- On Vercel: in-memory seed plus `/tmp` (preview instances reset on cold start). Seed rehearsal audio lives at `data/uploads/harbor-rehearsal.wav` and is served only through the session-gated `/api/media/[filename]` route (included in the serverless bundle via `outputFileTracingIncludes`).

Directors can restore Harbor Church from **Settings → Reset demo data**.

## Typical Sunday flow

1. Sign in as **director**.
2. Settings → Modules (or `/onboarding`) to pick org type and modules. Use **Harbor FC (Sports)** to hide Worship.
3. Create a plan when Worship is on, or a recurring event from Calendar when Events is on.
4. Add songs from the library when Worship is on. Upload rehearsal audio — it plays on the song page and anywhere that song is on a setlist.
5. Assign people to positions on a plan or event.
6. Sign out, enter as **member**, accept/decline, and rehearse in-app when Worship is on.
7. Members add or delete their own blockouts under **Settings → Availability**. Directors see gold Conflict chips on overlapping assignments — save is never blocked, including recurring occurrences.

## Project layout

```
app/            routes, landing, studio, API (upload + media)
components/     shell, players, plan workspace, forms
lib/            seed, store, auth, server actions
data/uploads/   rehearsal audio
```

## Notes

This is a local-first MVP. The JSON store is not a multi-instance production database. Vercel previews keep Harbor Church in memory so the build never writes `data/` on a read-only serverless filesystem. Production and Vercel deploys must set `SESSION_SECRET`; the app will not sign or verify sessions without it.

`vercel.json` pins the framework to **nextjs** and the build command to `npm run build`. Do not set Output Directory to `public` — Next.js uses `.next` plus serverless functions. If a dashboard override still forces `public`, clear **Project Settings → Build & Output → Output Directory** and leave it empty.
