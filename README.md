# Forge

A single-user personal accountability tracker — DSA, system design, gym, and
social-posting streaks, structured "challenges", side projects, and connected
GitHub/LeetCode profiles. Built with Next.js 16 (App Router), Supabase, and
shadcn/ui.

## What works today (Pass 1)

- **Email + password auth** (single user; public signup disabled) with password
  reset by email.
- **Daily dashboard** — today's checklist (DSA, system design, gym, X, LinkedIn),
  per-habit **streaks**, an inline **DSA quick-log** form, and an
  **active-challenge banner** (current phase + today's topic + progress).
- **DSA log** page with topic/difficulty/solved filters.
- **Full database schema + RLS** for every planned feature, plus the **45-day
  TakeUForward SDE Sheet** challenge seed.

### Streak rules (the interesting part)

Computed by pure, unit-tested functions in `lib/streaks.ts`:

- **DSA / System design** — daily; consecutive days satisfied.
- **Gym** — daily, but a marked **rest day bridges** the streak (it never breaks
  it); an *unlogged* day does break it.
- **LinkedIn** — weekly (calendar weeks, Monday start).
- **X / Twitter** — **daily while a challenge is active, weekly otherwise**.
- Across all of them, *today not yet logged* is **pending**, never a break.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase URL + anon key
pnpm dev
```

Full instructions (create the Supabase project, run migrations, create your
user, seed the challenge, deploy) are in **[SETUP.md](./SETUP.md)**.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build + typecheck |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests (streak + challenge engines) |

## Roadmap

Pass 2: system design page · gym heatmap · X/LinkedIn social log.
Pass 3: challenges UI (data-driven phase editor) + settings.
Pass 4: side projects board + milestone log.
Pass 5: GitHub contribution graph + LeetCode stats + charts.
