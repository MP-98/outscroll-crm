# Outscroll Media CRM

Internal CRM for Outscroll Media — a creator/talent management agency. Single-tenant. INR only. Mobile-responsive web app on free-tier infra.

This repo is **Phase 1**: foundation + talent CRM core (talents, brands, outreaches, inbox, activity-first dashboard, Apify IG sync, daily email digest). The schema includes the Phase 2 + Phase 4 tables so future migrations aren't required.

See [`OUTSCROLL_CRM_MASTER_PROMPT.md`](./OUTSCROLL_CRM_MASTER_PROMPT.md) for the full v1 build spec.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **TypeScript** strict
- **Tailwind CSS v4** with custom design tokens (zinc + indigo, Inter font)
- **shadcn-style** primitives (Radix + cva), restyled to match Linear/Attio direction
- **Supabase** Postgres + Auth (magic-link only, no public signup) + Storage
- **react-hook-form + zod** for forms
- **TanStack Table** for tables
- **lucide-react** icons (v1.x — note: brand icons removed; we use `AtSign` for IG, `BriefcaseBusiness` for LinkedIn)
- **Resend** for the daily digest email
- **Apify** (`apify/instagram-scraper`) — only paid service, per-request
- **Vercel** for hosting + cron

## What ships in Phase 1

- Magic-link auth + admin-invite-only team
- Talents: list, filters (niche, city, status, exclusivity, manager), search, detail with 6 tabs (Overview, Outreaches, Rate card, Contacts, Documents, Revenue), contacts CRUD, IG sync button
- Brands: list, search, detail with POCs, outreach history, edit
- Outreaches: table ↔ kanban toggle, drag-to-update stage, detail page with activity timeline, auto `status_change` activity, follow-up enforcement on create
- Inbox: due today / overdue / upcoming, assigned-to-me toggle, snooze + mark paid
- Dashboard: activity-first (no revenue cards in v1) with 4 metric cards, leaderboard, per-talent activity bar
- Settings: Profile, Niches dictionary, Tags overview, Team (admin), Apify (admin) — token status + monthly spend + recent runs
- Apify IG sync with rate limit (1 per user per 30s + 5/min global) and audit row in `ig_sync_runs`
- Daily digest email via Resend, run on Vercel cron at 09:00 IST

Out of v1: managed brands, campaigns, external influencer pool (schema in place, UI ships in Phase 2). Talent + Brand portals (Phase 4).

## Getting started

### 1. Provision Supabase

1. Create a free project at <https://supabase.com>.
2. SQL Editor → paste [`db/schema.sql`](./db/schema.sql) → Run.
3. (Optional) Run [`db/seed.sql`](./db/seed.sql) to seed common Indian creator niches.
4. Auth → Settings: enable email magic-link sign-in. Add your prod URL to "Redirect URLs": `https://your-domain/auth/callback`.

### 2. Install + configure env

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 3. Seed the first admin

After filling `SEED_ADMIN_EMAIL` (defaults to `abhay@theproductfolks.com`):

```bash
npm run seed:admin
```

This sends a magic-link invite and writes a `profiles` row with `role='admin'`. The admin can then invite other teammates from `/settings/team`.

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

## Optional services

### Apify (Instagram sync)

Only required if you want the **Sync from Instagram** button on talent detail pages.

1. Sign up at <https://console.apify.com>.
2. Generate an API token.
3. Add to `.env.local`: `APIFY_TOKEN=...`.
4. The actor used is `apify/instagram-scraper`. Spend is reported in `/settings/apify`.

**Rate limits (chosen defaults):**

- 1 sync per user per 30 seconds
- 5 syncs per minute system-wide
- Configurable in [`server/actions/ig-sync.ts`](./server/actions/ig-sync.ts).

### Resend (daily digest email)

1. Sign up at <https://resend.com>.
2. Add a verified sender domain.
3. Add to `.env.local`: `RESEND_API_KEY=...` and `RESEND_FROM="Outscroll CRM <noreply@yourdomain.com>"`.
4. The cron schedule lives in [`vercel.json`](./vercel.json) — fires at `30 3 * * *` UTC = **09:00 IST**.
5. Set `CRON_SECRET` in `.env.local` and Vercel to authenticate cron requests.

If `RESEND_API_KEY` is unset, the cron returns OK without sending — safe to leave unconfigured.

## Defaults baked in

These were chosen as Phase 1 defaults (per spec section 15):

| Setting | Value | Where to change |
|---|---|---|
| Default commission % | 20% | `talents.default_commission_pct` per row, or `db/schema.sql` |
| "Live" outreach status | Posted on Instagram (not just confirmed) | Convention only — adjust user-facing copy in `lib/validations/outreach.ts` if needed |
| Apify per-user rate limit | 1 sync / 30s | `server/actions/ig-sync.ts` |
| Apify global rate limit | 5 syncs / minute | `server/actions/ig-sync.ts` |

## Project layout

```
/app
  (auth)/login/             magic-link sign-in
  (app)/                    sidebar + topbar shell (auth-gated)
    page.tsx                activity-first dashboard
    inbox/                  follow-ups due/overdue/upcoming
    talents/                list, new, [id] (6 tabs)
    brands/                 list, new, [id] (POCs / history / docs / edit)
    outreaches/             table ↔ kanban, [id] detail with timeline
    settings/               profile, niches, tags, team, apify
  api/cron/daily-digest/    Resend cron route
  auth/callback/            Supabase OTP callback
  auth/signout/             POST signout
/components
  ui/                       shadcn-style primitives (Button, Card, Sheet, etc.)
  shell/                    Sidebar, Topbar, CommandPalette, ShortcutsOverlay
  forms/                    Talent / Brand / Outreach forms
  tables/                   DataTable wrapper (TanStack)
  status-pill, channel-icon, tag-input, page-header
/lib
  supabase/{client,server,types}.ts
  apify/client.ts
  validations/*.ts          zod schemas per entity
  auth, currency, date, utils
/server/actions/            talents, brands, outreaches, settings, ig-sync
/db/schema.sql              full data model (Phase 1 + Phase 2 + Phase 4-ready)
/db/seed.sql                optional niche seed
/scripts/seed-admin.ts      first-admin bootstrap
/proxy.ts                   auth gate (Next.js 16 proxy convention)
/vercel.json                daily-digest cron at 09:00 IST
```

## Keyboard shortcuts

- `⌘K` / `Ctrl-K` — command palette (jump-to / create)
- `j` / `k` / `↓` / `↑` — list nav
- `Enter` — open selected row
- `?` — shortcuts overlay
- `Esc` — close drawer/dialog

## Scripts

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run seed:admin   # invite + promote first admin
```

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the env vars from `.env.example` to the Vercel project.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin.
5. In Supabase Auth → Redirect URLs, add `https://<your-domain>/auth/callback`.
6. Cron is configured automatically from `vercel.json`.

The only paid line item is Apify (per-request). Everything else (Supabase, Vercel, Resend) is free-tier.

## Phase 2 (next)

Per the spec, Phase 2 ships only after Phase 1 is in production. It adds: managed brands, external influencer pool with bulk-add, campaigns with brief + influencer-outreach kanban + deliverables tracker, campaign-side inbox merge, leaderboard expanded across both sides. The schema for all of this is already in place.
