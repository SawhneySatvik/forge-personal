<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Forge — project notes

Single-user personal accountability tracker. Stack: Next.js 16 (App Router) ·
React 19 · Supabase (Postgres + Auth via `@supabase/ssr`) · shadcn/ui
(`base-nova` style, built on **Base UI** — not Radix) · Tailwind v4 · Recharts.

## Conventions

- **Auth**: email + password, single user, public signup disabled. Session
  refresh + route protection live in `proxy.ts` (Next 16's renamed middleware).
  Server clients: `lib/supabase/server.ts`; browser: `lib/supabase/client.ts`.
- **Data access**: reads in Server Components via `lib/queries.ts`; mutations via
  Server Actions (`revalidatePath` after each); `app/api/*` route handlers are
  reserved for external proxies (GitHub/LeetCode) only.
- **Streaks/challenges are pure functions** (`lib/streaks.ts`, `lib/challenges.ts`)
  fed `DayRecord[]` projected from the wide `daily_logs` table. They never touch
  the DB and are unit-tested in `tests/`. Run `pnpm test` after touching them.
- **`daily_logs` is the single source of truth** for the checklist and every
  streak. Detail tables (`dsa_problems`, etc.) also flip the matching
  `daily_logs` flag in their server action.
- **Day keys** are `'YYYY-MM-DD'` resolved in the user's timezone. Use
  `lib/date.ts` helpers; never do ad-hoc `Date` math.
- **Base UI gotchas**: Button uses a `render` prop (not `asChild`); Select/Checkbox
  participate in forms via `name`. Add components with `npx shadcn@latest add`.
- **RLS** is enabled on every table (`auth.uid() = user_id`). Always include
  `user_id` on insert.

See `SETUP.md` for Supabase setup and `~/.claude/plans` for the build plan and
the remaining passes (system design, gym, social, challenges UI, projects,
integrations).
