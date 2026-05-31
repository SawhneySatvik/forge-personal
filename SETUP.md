# Forge — Setup Guide

Forge is a single-user personal accountability tracker (Next.js 16 App Router +
Supabase + TypeScript). This guide gets it running locally and on Vercel.

> **Pass 1 scope.** What's built so far: auth (email + password, password reset),
> the daily dashboard (today's checklist, per-habit streaks, inline DSA quick-log,
> active-challenge banner), and the DSA log page. The **full database schema for
> every planned feature** is already in the migrations, so later passes
> (system design, gym detail, social, challenges UI, projects, GitHub/LeetCode
> integrations) are additive.

---

## 1. Prerequisites

- Node 20+ and pnpm (`corepack enable` or `npm i -g pnpm`).
- A free [Supabase](https://supabase.com) account.

Install deps (already done if you scaffolded here):

```bash
pnpm install
```

---

## 2. Create the Supabase project

1. Create a new project at https://supabase.com/dashboard. Pick a strong DB
   password and a region close to you.
2. Once provisioned, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key (a.k.a. *publishable* key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Run the migrations

Open **SQL Editor** in the Supabase dashboard and run these files from
`supabase/migrations/` **in order**:

| Order | File | What it does |
|------|------|--------------|
| 1 | `0001_init.sql` | Extensions, enums, tables, indexes, `updated_at` trigger |
| 2 | `0002_rls.sql` | Enables Row Level Security + owner-only policies on every table |
| 3 | `0004_profile_trigger.sql` | Auto-creates a `profiles` row when a user signs up |
| 4 | `0005_challenge_logs.sql` | Per-challenge daily check-in table + RLS (challenge tracker) |
| 5 | `0006_checklist_and_sharing.sql` | Checklist challenges + `challenge_items`, public-sharing flags + anon read policies |

Run the two **seed** migrations **later** — they must run *while authenticated*
(they use `auth.uid()`). See step 6:

- `0003_seed_sde_sheet.sql` — the original 45-day cadence skeleton (optional).
- `0007_seed_sde_questions.sql` — the **190-question Striver SDE Sheet** checklist
  challenge. Requires `0006`. Idempotent (safe to re-run).

> Copy-paste each file's contents into a new SQL Editor query and click **Run**.

---

## 4. Create your single user & lock the door

This app is for **you only**.

1. **Auth → Users → Add user** → create your account with your email + a
   password. (Tick "Auto Confirm User" so you can sign in immediately.)
2. **Auth → Providers → Email** → turn **OFF** "Allow new users to sign up".
   Now nobody can self-register; only the user(s) you created can sign in.

---

## 5. Configure auth URLs (for password reset & email links)

**Auth → URL Configuration**:

- **Site URL**: `http://localhost:3000` for local dev (change to your Vercel
  domain in production).
- **Redirect URLs**: add both
  - `http://localhost:3000/**`
  - `https://YOUR-APP.vercel.app/**` (once deployed)

### Password-reset email

`/auth/confirm` accepts **both** Supabase auth flows:

- **Default (PKCE, `?code=`)** — works with no template edits, **but the reset
  link must be opened in the same browser** that requested it (the PKCE verifier
  is stored in that browser). Fine if you always reset on your own machine.
- **Recommended — token-hash flow** so the link works from any device (e.g.
  opening it on your phone). Edit **Auth → Email Templates → Reset Password** to:

  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password">
    Reset password
  </a>
  ```

  This verifies server-side with `verifyOtp` and needs no per-browser cookie.

---

## 6. Environment variables

Copy the example and fill it in:

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
# NEXT_PUBLIC_SITE_URL is optional locally; set it to your domain in production
# so password-reset links are absolute. GITHUB_TOKEN is only needed in Pass 5.
```

---

## 7. Run it

```bash
pnpm dev          # http://localhost:3000
```

Sign in with the user you created. You'll land on the dashboard.

**Seed the 45-day challenge:** now that you're signed in, go back to the
Supabase **SQL Editor** and run `0003_seed_sde_sheet.sql`. Refresh the
dashboard — the active-challenge banner ("Phase 1: Arrays · Day 1/7 · Today: …")
appears. Edit the seeded phases/topics freely; challenges are pure data.

Set your display name / timezone later via the (upcoming) settings page, or
directly in the `profiles` row (default timezone is `Asia/Kolkata`).

---

## 8. Verify

```bash
pnpm test         # pure streak + challenge engine unit tests (should be green)
pnpm build        # production build + typecheck
pnpm lint         # eslint
```

Manual smoke test: sign in → toggle the 5 checklist items (tap the gym row to
cycle *not logged → went → rest*) → watch the streak cards update → quick-log a
DSA problem → see it under "Logged today" and on the `/dsa` page → sign out →
confirm you're bounced to `/signin`.

---

## 9. Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add env vars in **Project Settings → Environment Variables**:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `NEXT_PUBLIC_SITE_URL` (your `https://YOUR-APP.vercel.app` URL).
3. After the first deploy, update Supabase **Site URL** and **Redirect URLs** to
   your `https://YOUR-APP.vercel.app` domain (step 5).

## Known hardening notes (deferred, low priority)

- **Profile auto-creation** relies on the `0004` trigger running as a role with
  `BYPASSRLS` — true on hosted Supabase (the `postgres` role), so the happy path
  works. On a custom/self-hosted setup with a restricted owner, insert your
  profile row manually (`insert into profiles (user_id) values ('<your-uid>')`);
  the app also degrades gracefully to the default timezone if it's missing.
- **Password change** via `/update-password` uses the active session and does not
  re-prompt for the current password (standard Supabase behaviour). Acceptable
  for a single-user app; add re-auth later if you want defence-in-depth.

---

## 10. Later: GitHub & LeetCode integrations (Pass 5)

When you build the Profiles page:

- **GitHub**: create a **classic Personal Access Token** with the `read:user`
  scope and set it as `GITHUB_TOKEN`. (Required because the contribution graph
  is only available via GitHub's authenticated GraphQL API — not REST.)
- **LeetCode**: no key needed; the public GraphQL endpoint is queried
  server-side.

---

## Project structure

```
app/
  (auth)/        signin · forgot-password · update-password
  auth/confirm/  email-link callback (PKCE + OTP)
  signout/       POST → sign out
  (app)/         authenticated shell
    dashboard/   home: checklist · streaks · quick-log · challenge banner
    dsa/         problem log + filters
lib/
  supabase/      @supabase/ssr server + browser clients
  date.ts        timezone-aware day-key helpers
  streaks.ts     pure streak engine (daily / weekly / switching · rest-aware)
  challenges.ts  pure challenge engine (phase/topic resolution · progress)
  queries.ts     server-only read helpers
  habits.ts      habit registry
  types.ts       domain types
proxy.ts         Supabase session refresh + route protection (Next 16 "proxy")
supabase/migrations/   schema · RLS · seed
tests/           Vitest unit tests for the engines
```
