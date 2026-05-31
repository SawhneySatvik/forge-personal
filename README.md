# Forge

A single-user personal accountability tracker — daily disciplines (DSA, system
design, gym, X & LinkedIn posting), structured multi-phase **challenges**, side
projects with milestones, and connected **GitHub / LeetCode** profiles, all
fed by a pure, unit-tested streak engine.

Built with **Next.js 16** (App Router) · **React 19** · **Supabase**
(Postgres + Auth) · **shadcn/ui** on **Base UI** · **Tailwind v4** · **Recharts**.

> **Status:** feature-complete against the original spec — build, lint, and 46
> unit tests green. **Deployed on Vercel** with a **live Supabase** backend.

---

## Features

- **Email + password auth** — single user, public signup disabled, password
  reset by emailed link. Session refresh + route protection in `proxy.ts`
  (Next 16's renamed middleware).
- **Daily dashboard** — today's checklist (DSA, system design, gym, X, LinkedIn),
  per-habit **streak cards**, an aggregate activity **heatmap**, an inline **DSA
  quick-log**, and an **active-challenge banner** (current phase, today's topic,
  check-in progress).
- **DSA log** — **pick-from-sheet** quick-log (selecting an SDE-sheet question
  auto-fills name / link / difficulty), topic / difficulty / solved filters, and a
  merged activity heatmap; responsive (table on desktop → cards on mobile).
- **LeetCode-derived tracking** — one click on **Sync LeetCode** pulls your
  submission calendar and counts every solved day as DSA-done (feeds the streak +
  heatmap). Cached in `profile_snapshots`.
- **System Design** — topic CRUD with a coverage heatmap.
- **Gym** — went / rest-day logging with a heatmap.
- **Social** — weekly X / LinkedIn posting grid.
- **Challenges** — two kinds:
  - **Checklist** (e.g. the **190-question Striver SDE Sheet**) — mark each
    question solved (inline, optimistic, "mark whole section" batch) and the bar
    fills by completion, grouped by the 27 topic sections with per-difficulty stats.
  - **Cadence** — the original phase/timeline challenge with a **daily check-in
    tracker** (per-challenge heatmap, streak, completion). Logging a DSA problem
    against it auto-checks-in for the day.
- **Public sharing** — flip a challenge (or your profile) public and share a
  read-only page at `/u/your-handle` or `/share/c/[id]` — no login required, gated
  by narrow anon RLS policies (only `is_public` rows are ever exposed).
- **Insights** — consistency score, current + longest streak per habit, weekly
  stacked activity, DSA by difficulty / topic / cumulative, and system-design
  coverage (Recharts, fed by the pure `lib/analytics.ts`).
- **Projects** — side-project status board + milestone timeline.
- **Profiles** — server-side **GitHub** integration (contribution heatmap, repos,
  recent activity) and **LeetCode** (solved-by-difficulty donut), cached in
  `profile_snapshots` and refreshed via a server action. GitHub username
  auto-resolves from the token when left blank.
- **Settings** — profile, integration usernames, and theme.

Bold, motion-driven UI throughout (`components/fx/*`), the dark-first
**Forge / Ember** theme (OKLCH tokens), a desktop sidebar + mobile bottom bar,
and reduced-motion safety.

### Streak rules (the interesting part)

Computed by pure, unit-tested functions in `lib/streaks.ts` and
`lib/challenges.ts` — they take projected `DayRecord[]`, never touch the DB, and
are tested by injecting `today`:

- **DSA / System design** — daily; consecutive days satisfied.
- **Gym** — daily, but a marked **rest day bridges** the streak (never breaks
  it); an *unlogged* day does break it.
- **LinkedIn** — weekly (calendar weeks, Monday start).
- **X / Twitter** — **daily while a challenge is active, weekly otherwise**.
- **Challenge check-ins** — daily, tracked in `challenge_logs`.
- Across all of them, *today not yet logged* is **pending**, never a break.

## Architecture

```
proxy.ts                    session refresh + route protection (Next 16 middleware)
lib/
  supabase/{server,client}  @supabase/ssr clients (server reads / browser)
  queries.ts                Server-Component reads ("server-only")
  streaks · challenges      pure engines (unit-tested)
  analytics.ts              pure insights aggregations (unit-tested)
  date · habits · types · timezones
  integrations/{github,leetcode}.ts   server-side fetch + map
components/
  ui/*                      shadcn base-nova primitives (+ chart.tsx)
  fx/*                      motion fx (animated-number, glow-card, bento-grid, beams, sparkles…)
  nav/*                     sidebar, bottom-bar, theme-toggle
  habit-heatmap · streak-stat
app/
  (auth)/*                  signin · forgot/update-password · signout · /auth/confirm
  (app)/                    authenticated shell
    dashboard · dsa · system-design · gym · social
    challenges · insights · projects · profiles · settings
supabase/migrations/0001..0005.sql
tests/{date,streaks,challenges,analytics}.test.ts   (46 tests)
```

**Data flow:** reads happen in Server Components via `lib/queries.ts`; mutations
go through Server Actions (`getUser()` → zod validate → mutate with `user_id` →
`revalidatePath`). `app/api/*` is reserved for the external GitHub/LeetCode
proxies. `daily_logs` is the single source of truth for every habit streak —
detail tables (`dsa_problems`, etc.) flip its flags in their server action. RLS
is forced on every table (`auth.uid() = user_id`).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm dev                     # http://localhost:3000
```

Then create the Supabase project, run the migrations, create your user, and seed
the challenge. Full step-by-step instructions are in **[SETUP.md](./SETUP.md)**.

### Environment variables (`.env.local`, git-ignored)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anon/public key |
| `GITHUB_TOKEN` | for Profiles | PAT with `metadata` read (contribution graph is GraphQL-only) |
| `NEXT_PUBLIC_SITE_URL` | prod | Absolute base for password-reset links |

### Database

Run the SQL migrations in order in the Supabase SQL editor:

`0001_init` → `0002_rls` → `0004_profile_trigger` → `0005_challenge_logs` →
`0006_checklist_and_sharing` (all while unauthenticated), then **while
authenticated** (they use `auth.uid()`): `0007_seed_sde_questions` to load the
190-question Striver SDE Sheet checklist (idempotent), and optionally
`0003_seed_sde_sheet` for the legacy 45-day cadence skeleton.

Tables: `profiles`, `daily_logs` (wide, source of truth), `dsa_problems`,
`system_design_topics`, `challenges` + `challenge_phases` + `challenge_items`
(checklist questions), `challenge_logs`, `side_projects` + `project_milestones`,
`profile_snapshots`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build + typecheck |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests (streak / challenge / analytics engines) |

## Deployment

Deployed on **Vercel** (config in `vercel.json`) against a **live Supabase**
backend. To deploy your own: import the repo into Vercel, set the environment
variables above, then add your production domain to Supabase **Auth → URL
Configuration** (Site URL + Redirect URLs). See [SETUP.md](./SETUP.md) for the
full walkthrough.

## Tech notes

- **Base UI, not Radix** — `Button` uses a `render` prop (not `asChild`) and
  needs `nativeButton={false}` when rendering a link; `Select`/`Checkbox` submit
  via `name`. Add components with `npx shadcn@latest add`.
- **Day keys** are `'YYYY-MM-DD'` resolved in the user's timezone — always via
  `lib/date.ts`, never ad-hoc `Date` math.
- **LeetCode** uses an unofficial GraphQL endpoint (server-side, with a `Referer`
  header); it degrades gracefully to a cached/empty state.

Project conventions for future contributors live in
[`AGENTS.md`](./AGENTS.md) (imported by `CLAUDE.md`).
