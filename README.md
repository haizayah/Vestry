# Vestry

A calm worship planning studio for music directors and teams. Plan Sunday in one place: song library, setlists, in-app rehearsal (YouTube + uploaded audio), and a light team schedule.

Harbor Church ships as a demo church so you can walk the full Sunday workflow in minutes.

## What it is

Vestry is an upgraded, editorial take on Planning Center Services — not a full church OS. It is for the hour before the room fills.

**In this MVP**

- Marketing landing at `/`
- Demo auth with persisted session (director + member)
- App shell: Home, Plans, Songs, Team, Settings
- Song library CRUD (title, artist, key, tempo, notes, YouTube, audio)
- Service plans with a reorderable order of service
- YouTube and uploaded audio play **in-app** on song and plan pages
- Team lite: assign positions; members accept or decline
- Director dashboard: upcoming plans, quick create, media readiness

**Out of scope**

Giving, Check-ins, Groups, a full Calendar product, CCLI, native apps, Spotify/Apple Music APIs.

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
- A seven-person roster with assignments already on the plans

Jordan Ellis (member) has a pending invite on Sep 13 and an accepted seat on Sep 20.

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
2. Create a plan (or open Sunday Gathering).
3. Add songs from the library, a YouTube block, and announcements.
4. Upload rehearsal audio on a song — it plays on the song page and anywhere that song is on a setlist.
5. Assign people to positions.
6. Sign out, enter as **member**, open the plan, accept/decline, and rehearse in-app.

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
