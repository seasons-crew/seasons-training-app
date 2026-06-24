# Seasons Training App

Mobile-first workout player and lightweight dashboard for Seasons. The trainee experience lives at shared `/workouts/:id` URLs. The dashboard lets Danny/Bobby manage daily sport-specific workouts, steps, and media.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + Postgres
- Vercel hosting
- Mux-ready media model

## Local Development

```bash
pnpm install
pnpm dev
```

Open:

- Workout player: http://localhost:3000/workouts/snow-today
- Dashboard: http://localhost:3000/dashboard
- Sneak preview demo: http://localhost:3000/workouts/water-tomorrow?sneak=true

The dashboard uses a shared password gate. Without a local `.env`, the default development password is:

```txt
seasons
```

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required for dashboard editing and database-backed data:

```txt
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
DASHBOARD_PASSWORD=your-shared-dashboard-password
DASHBOARD_SESSION_TOKEN=a-long-random-string
```

If `DATABASE_URL` is missing, the app falls back to mock workouts/media. Dashboard editing controls are visible but disabled.

## Database Setup

Use a Postgres database from Vercel Marketplace, preferably Neon for this MVP.

After `DATABASE_URL` is set:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed data mirrors the current mock workouts and media library.

## Data Model

Core tables:

- `Workout`: title, sport, active date, future status field
- `WorkoutStep`: ordered step list, media reference, advance behavior
- `MediaAsset`: playback URL, thumbnail, Mux IDs, tags, source Drive URL

Step advance modes:

- `video_end`: advance when video ends
- `timer`: loop video with audio until timer ends
- `manual`: loop video until trainee taps the configured button

## Scripts

```bash
pnpm lint
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

There is no test suite yet.

## Mux Seed Helper

`scripts/build-media-seed.mjs` converts exported Mux asset JSON into media seed JSON:

```bash
node scripts/build-media-seed.mjs mux-assets.json media-seed.json
```

This does not upload videos yet. It formats existing Mux asset metadata into the app's media shape.

## Vercel Notes

Before deployment work, upgrade the local Vercel CLI:

```bash
npm i -g vercel@latest
```

or:

```bash
pnpm add -g vercel@latest
```

Set these environment variables in Vercel:

- `DATABASE_URL`
- `DASHBOARD_PASSWORD`
- `DASHBOARD_SESSION_TOKEN`

Then deploy the Next.js app normally through Vercel.
