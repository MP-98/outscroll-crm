# Outscroll Media CRM — v1 Build Spec (FINAL)

## 1. What you're building

An internal CRM for **Outscroll Media**, an Indian creator/talent management agency. Single-tenant. INR only. Mobile-responsive web app (no native). Strict free-tier infra; the **only paid service** is the Apify Instagram scraper, used per-request.

Two business sides:

**A. Talent representation** — Outscroll signs Instagram creators ("talents") and proactively sources brand deals on their behalf. Outreach happens across IG DMs, LinkedIn, WhatsApp, email, and phone calls.

**B. Brand management** — Outscroll manages Instagram for brand clients (currently 2 onboarded; more incoming) and runs influencer marketing campaigns. Per campaign, the team reaches out to 30–50 nano/micro influencers from a **separate pool** (not the talent roster), with ~30 typically going live.

## 2. Users & roles

Four roles, baked into the schema from day one:
- **admin** — full access; team management; only role that can invite users
- **member** — internal team; reads everything; edits records they own
- **talent** — *(Phase 4 portal, not built in v1)* sees their own outreaches, payments, documents
- **brand** — *(Phase 4 portal, not built in v1)* sees their managed-brand campaigns + influencers

v1 builds **admin + member** portals fully. Schema supports talent + brand from day one so Phase 4 needs no migrations.

Team size: 5–10 people initially, growing.

## 3. Design direction

References: **Linear, Attio, Plain, Height, Cron, Vercel dashboard.**

- Dense, information-rich UI — tables, not cards, by default
- Monochrome base (zinc 50–950) + ONE accent: **indigo-600**
- Inter, 14px base, tight tracking
- Borders/shadows: very subtle (`border-zinc-200`, `shadow-sm` max)
- Keyboard-first: ⌘K palette, j/k list nav, n create, / search, esc close, ? shortcut overlay
- Detail views = right-side drawers (Linear-style), not centered modals; deep-linkable as full pages
- Smooth, fast transitions; nothing janky
- Empty states are illustrated + actionable, never blank
- Loading: skeletons, never full-page spinners

If a shadcn default looks too "bootstrap," restyle it.

## 4. Tech stack (free-tier first)

- **Next.js 15** (App Router, Server Components where helpful)
- **TypeScript**, strict
- **Tailwind CSS v4**
- **shadcn/ui** (restyled to match the design direction)
- **Supabase Postgres** (free tier)
- **Supabase Auth** — magic link only, no public signup (admin invites)
- **Supabase Storage** — uploaded contracts/IDs/briefs
- **Server Actions** for mutations
- **react-hook-form + zod** for forms
- **TanStack Table** for tables
- **lucide-react** icons
- **date-fns**
- **Framer Motion** (sparingly)
- **Resend** free tier — daily reminder email digest
- **Apify** — Instagram Profile Scraper (`apify/instagram-scraper`) for follower / avg-reel-view sync. **Only paid service.** Per-request, never bulk auto.
- **Vercel** free tier hosting
- **INR** only

## 5. Data model

All tables get `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz` unless noted. Add indexes on every FK and the status/date columns called out below.

```sql
-- Auth + roles (4 roles from day one)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  role text check (role in ('admin','member','talent','brand')) default 'member',
  -- Linkage for Phase 4 talent/brand portals (unused in v1 but ready)
  linked_talent_id uuid,
  linked_brand_id uuid,
  linked_managed_brand_id uuid,
  created_at timestamptz default now()
);

-- Editable niche dictionary (powers the multi-select with inline create)
create table niches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- Talents (Outscroll's roster of IG creators)
create table talents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  ig_handle text not null,
  ig_followers integer,
  avg_reel_views integer,
  ig_metrics_synced_at timestamptz,
  niches text[] default '{}',          -- references niches.name (denormalized for query speed)
  city text,
  languages text[] default '{}',
  status text check (status in ('active','paused','offboarded')) default 'active',
  exclusivity text check (exclusivity in ('exclusive','non_exclusive')) default 'non_exclusive',
  onboarded_at date,
  manager_id uuid references profiles(id),
  rate_reel integer,
  rate_story integer,
  rate_post integer,
  rate_integration integer,
  rate_exclusivity integer,
  default_commission_pct numeric(5,2) default 20.00,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- index: ig_handle, status, manager_id

create table talent_contacts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talents(id) on delete cascade,
  kind text check (kind in ('phone','whatsapp','ig_link','ig_dm','email','other')) not null,
  value text not null,
  is_primary boolean default false,
  label text
);

-- Brands (companies you pitch talents to)
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  ig_handle text,
  website text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table brand_pocs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  ig_handle text,
  linkedin_url text,
  notes text
);

-- Outreaches: thread between a talent and a brand
create table outreaches (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talents(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  primary_poc_id uuid references brand_pocs(id),
  channel text check (channel in ('ig_dm','linkedin','whatsapp','email','call','other')) not null,
  status text check (status in (
    'prospected','contacted','in_conversation','brief_received',
    'negotiating','confirmed','live','paid','lost','on_hold'
  )) not null default 'prospected',
  deliverables text,
  proposed_amount integer,
  agreed_amount integer,
  commission_pct numeric(5,2),
  next_followup_at date not null,
  owner_id uuid references profiles(id),
  notes text,
  tags text[] default '{}',
  lost_reason text,
  paid_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- index: status, next_followup_at, talent_id, brand_id, owner_id

-- Activity log on an outreach (manual; status changes auto-log)
create table outreach_activities (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid not null references outreaches(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text check (channel in ('ig_dm','linkedin','whatsapp','email','call','note','status_change','other')) not null,
  direction text check (direction in ('outbound','inbound','internal')),
  summary text not null,
  attachment_url text,
  author_id uuid references profiles(id)
);
-- index: outreach_id, author_id, occurred_at

-- Brands whose IG Outscroll manages
create table managed_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  ig_handle text,
  website text,
  monthly_retainer integer,
  status text check (status in ('active','paused','churned')) default 'active',
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  notes text,
  onboarded_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- External influencer pool (separate from talents; mostly nano/micro)
create table external_influencers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  ig_handle text not null unique,
  ig_followers integer,
  avg_reel_views integer,
  ig_metrics_synced_at timestamptz,
  niches text[] default '{}',
  city text,
  contact_email text,
  contact_phone text,
  rate_reel integer,
  rate_story integer,
  rate_post integer,
  notes text,                          -- free-form, editable
  tags text[] default '{}',
  created_at timestamptz default now()
);
-- index: ig_handle, niches (gin)

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  managed_brand_id uuid not null references managed_brands(id) on delete cascade,
  name text not null,
  brief text,
  budget integer,
  deliverable_target text,
  starts_on date,
  ends_on date,
  status text check (status in ('planning','live','wrapping','done','cancelled')) default 'planning',
  owner_id uuid references profiles(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-influencer outreach inside a campaign
create table campaign_outreaches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  external_influencer_id uuid references external_influencers(id),
  talent_id uuid references talents(id),    -- if pulling from roster instead of pool
  channel text check (channel in ('ig_dm','linkedin','whatsapp','email','call','other')),
  status text check (status in (
    'shortlisted','contacted','in_conversation','negotiating',
    'confirmed','live','paid','lost','on_hold'
  )) default 'shortlisted',
  proposed_amount integer,
  agreed_amount integer,
  deliverables text,
  next_followup_at date not null,
  owner_id uuid references profiles(id),
  payment_status text check (payment_status in ('pending','invoiced','paid','overdue','na')) default 'pending',
  paid_on date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (external_influencer_id is not null or talent_id is not null)
);
-- index: campaign_id, status, next_followup_at, owner_id

create table campaign_outreach_activities (
  id uuid primary key default gen_random_uuid(),
  campaign_outreach_id uuid not null references campaign_outreaches(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text not null,
  direction text,
  summary text not null,
  attachment_url text,
  author_id uuid references profiles(id)
);

-- Payments (financial detail; coarse statuses live on parent rows)
create table payments (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('brand_to_outscroll','outscroll_to_talent','outscroll_to_influencer','retainer')) not null,
  outreach_id uuid references outreaches(id),
  campaign_outreach_id uuid references campaign_outreaches(id),
  managed_brand_id uuid references managed_brands(id),
  talent_id uuid references talents(id),
  external_influencer_id uuid references external_influencers(id),
  amount integer not null,
  status text check (status in ('pending','invoiced','paid','overdue','cancelled')) default 'pending',
  due_date date,
  paid_on date,
  invoice_number text,
  notes text,
  created_at timestamptz default now()
);

-- Documents (uploaded contracts, IDs, briefs)
create table documents (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('contract','brief','invoice','id_proof','other')) not null,
  storage_path text not null,
  filename text not null,
  size_bytes integer,
  talent_id uuid references talents(id),
  brand_id uuid references brands(id),
  managed_brand_id uuid references managed_brands(id),
  campaign_id uuid references campaigns(id),
  outreach_id uuid references outreaches(id),
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Reminders (auto-created from next_followup_at + manual)
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  outreach_id uuid references outreaches(id),
  campaign_outreach_id uuid references campaign_outreaches(id),
  due_at timestamptz not null,
  message text,
  done boolean default false,
  created_at timestamptz default now()
);

-- Apify sync history (audit + cost tracking)
create table ig_sync_runs (
  id uuid primary key default gen_random_uuid(),
  target_kind text check (target_kind in ('talent','external_influencer')) not null,
  target_id uuid not null,
  ig_handle text not null,
  apify_run_id text,
  status text check (status in ('queued','running','succeeded','failed')) default 'queued',
  followers integer,
  avg_reel_views integer,
  reels_sampled integer,            -- usually 9–10
  cost_credits numeric(10,4),
  error_message text,
  triggered_by uuid references profiles(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

## 6. Pages & views

Sidebar (Linear-style): **Inbox · Talents · Brands · Outreaches · Managed Brands · Campaigns · Influencers · Settings**.

### `/` Dashboard — **activity-first**, not revenue

Date range toggle (Today / This week / Last 7 days). Cards:
- **Outreaches created** (count + delta vs prior period)
- **Activities logged** (count + delta)
- **Follow-ups due today** (count)
- **Talents idle 14d+** (count)

Below the cards:
- **Per-user leaderboard table** for the selected period: full_name, talent-side outreaches created, talent-side activities logged, campaign outreaches created, campaign-side activities logged.
- **Per-talent activity bar** (last 7 days, sorted desc): talent, brands pitched, last activity at.
- **Active campaigns row** — each managed brand's live campaigns with influencer outreach progress (X contacted / Y confirmed / Z paid).

**No revenue / commission cards in v1** — explicit user direction. Volume-of-outreach is the operating metric.

### `/inbox`
Three sections: **Due today · Overdue · Upcoming this week.** Items pull from BOTH `outreaches.next_followup_at` AND `campaign_outreaches.next_followup_at`, with a source badge. Each row: counterparty (talent ↔ brand or campaign ↔ influencer), channel icon, last activity timestamp, snooze/done/open. Default-filter to "assigned to me" with a toggle.

### `/talents`
Sortable, filterable table. Columns: name, ig_handle (links to `instagram.com/handle` in new tab), followers, avg reel views, niches, status, exclusivity, manager, active outreach count, last outreach activity. Filters: niche, city, status, exclusivity, manager. Fuzzy search on name + handle. Row click → drawer.

"New talent" form fields: name, ig_handle, ig_followers, avg_reel_views, niches (multi-select with inline "+ add new niche"), city, languages (multi-select), exclusivity, onboarded_at, manager_id, rate_reel, rate_story, rate_post, rate_integration, rate_exclusivity, default_commission_pct, contacts (repeatable rows: kind + value + label).

### `/talents/[id]`
Header: name, ig_handle (linked), followers + last-synced-at + **Sync from Instagram** button (calls Apify), niches, status pill, exclusivity pill, manager, edit.

Tabs:
- **Overview** — niches, languages, city, contacts, tags. Recent activity timeline across all outreaches involving this talent.
- **Outreaches** — chronological list grouped by status (mini-kanban-list); "Add outreach" with brand picker.
- **Rate card** — editable rates table (INR).
- **Contacts** — phone / WhatsApp / IG link / IG DM / email rows; primary flag.
- **Documents** — upload/list contracts, ID proofs, briefs.
- **Revenue** — lifetime: total deals confirmed, total deals paid, total commission earned (sum of `agreed_amount × commission_pct/100` over paid outreaches).

### `/brands`
Table: name, industry, ig_handle (linked), website (linked), # active outreaches, # lifetime deals closed, last contacted date, tags. Search + filter.

### `/brands/[id]`
Header: name, industry, ig_handle (linked), website (linked).
Tabs:
- **POCs** — list/add/edit
- **Outreach history** — chronological feed across all your talents (talent + status + agreed_amount + last activity)
- **Notes**
- **Documents**

### `/outreaches`
Toggle: **Table** ↔ **Kanban**.
- Table columns: talent, brand, status pill, channel icon, owner, agreed_amount, next_followup_at, last activity. Sort/filter all columns.
- Kanban: pipeline stages as columns; cards show talent + brand + amount + days-in-stage. Drag = status change → auto-logs activity.
- "New outreach" → drawer; `next_followup_at` is **required**.

### `/outreaches/[id]`
Drawer (deep-linkable as full page). Top: talent ↔ brand, status dropdown, owner, channel.
Sections:
- **Deal terms** — deliverables, proposed/agreed amount, commission %, paid_at.
- **Activity timeline** — chronological. Each entry: channel icon, direction arrow, summary, author, timestamp. "Add activity" at top.
- **Linked POC at brand**.
- **Notes**.
- **Documents**.

Activities are append-only; status changes auto-log a `status_change` activity (`"X → Y"`).

### `/managed-brands`, `/managed-brands/[id]`
List + detail. Detail tabs: Overview · Campaigns · Documents · Notes.

### `/campaigns`, `/campaigns/[id]`
Cross-brand list with filters (managed brand, status, date range).
Detail tabs:
- **Brief** — name, brief, budget, deliverable_target, start/end dates, status.
- **Influencer outreach** — kanban + table, same UX as `/outreaches`. "Add influencers from pool" multi-select picker. Per-row: payment_status inline-editable, paid_on.
- **Deliverables tracker** — simple table tracking what each confirmed influencer is committed to + done/pending.
- **Documents**.

### `/influencers`
External influencer pool. Table columns: name, ig_handle (linked), followers, avg reel views, niches, rate_reel, rate_story, rate_post, # campaigns participated, last activity, tags, notes preview. Search + filter. **Bulk-add to a campaign** action.

"New influencer" form: name, ig_handle, ig_followers, avg_reel_views, niches, city, contact_email, contact_phone, rate_reel, rate_story, rate_post, notes, tags. **Sync from Instagram** button (Apify).

### `/influencers/[id]`
Profile + cross-campaign outreach history. Notes editable inline.

### `/settings`
- **Team** — list of profiles; admin-only invite via email; assign role.
- **Niches** — managed list (edit/delete; cascade-protect if in use).
- **Tags** — managed lists per entity type.
- **Profile** — your name, avatar.
- **Apify** — admin-only: API token field, monthly spend display (sum of `ig_sync_runs.cost_credits`), kill switch.

### `/login`
Magic-link only. Outscroll wordmark + "Sign in with email."

## 7. Pipelines

**Outreach (talent-side)**: `prospected → contacted → in_conversation → brief_received → negotiating → confirmed → live → paid`. Branches at any point: `lost` (with `lost_reason`), `on_hold`.

**Campaign-outreach (brand-managed side)**: `shortlisted → contacted → in_conversation → negotiating → confirmed → live → paid`. Branches: `lost`, `on_hold`.

Every status transition writes a `status_change` activity row with summary `"X → Y"`.

## 8. Auth & roles

- **admin**: full access; invite team; configure Apify token.
- **member**: read-all; edit records they own (`owner_id` / `manager_id` = self) or are explicitly assigned to; create new records.
- **talent / brand**: schema only — no portal in v1; no login routes wired up.

Enforce in Server Actions. Skip Postgres RLS in v1; introduce in Phase 4 when external roles get portals.

## 9. Apify Instagram sync

**Scope**: pull `followers` and `avg_reel_views` for a talent or external influencer.

**Trigger**: per-record button (**Sync from Instagram**) on talent + external_influencer detail. Never bulk auto, never on a cron. User initiates each run.

**Implementation**:
- Use Apify actor `apify/instagram-scraper` (or `apify/instagram-profile-scraper`) with the talent's `ig_handle`.
- Server Action calls the Apify run-sync endpoint with `resultsLimit: 12` to fetch the 9–10 most recent reels (request 12 to be safe; filter by post type = video/reel).
- Compute: `followers` = profile.followersCount; `avg_reel_views` = mean of `videoViewCount` across the most recent 9–10 reels (drop posts that aren't reels).
- Write the values to the target row, set `ig_metrics_synced_at = now()`, and write an `ig_sync_runs` row capturing apify_run_id, reels_sampled, cost_credits, status.
- UI shows last-synced timestamp under followers; on click, button shows a spinner; on success, values update inline.
- Rate-limit per user (e.g. 1 run per 30s) to prevent accidental bursts. Show monthly spend in `/settings → Apify`.

**Failure handling**: surface Apify error inline; persist `ig_sync_runs.status = 'failed'` with message; don't overwrite existing values.

**Token storage**: Apify token in env var `APIFY_TOKEN`, surfaced (read-only mask) in `/settings → Apify`. Admin can rotate via env redeployment in v1.

## 10. Notifications

- **In-app inbox** at `/inbox` — primary surface.
- **Daily email digest** via Resend (free tier) on a Vercel cron at 9:00 AM IST: per-user list of due-today + overdue + 14-day-stale outreaches and campaign outreaches.
- No push, no WhatsApp.

## 11. File structure

```
/app
  /(auth)/login/page.tsx
  /(app)
    layout.tsx                  # sidebar + topbar + ⌘K provider
    page.tsx                    # dashboard
    inbox/page.tsx
    talents/{page,[id]/page}.tsx
    brands/{page,[id]/page}.tsx
    outreaches/{page,[id]/page}.tsx
    managed-brands/{page,[id]/page}.tsx
    campaigns/{page,[id]/page}.tsx
    influencers/{page,[id]/page}.tsx
    settings/{page,team,niches,tags,profile,apify}/page.tsx
  /api/cron/daily-digest/route.ts
/components
  /ui/*                         # shadcn primitives, restyled
  /tables/*                     # generic DataTable
  /kanban/*
  /drawers/*
  /forms/*
  /shell/{Sidebar,Topbar,CommandPalette}.tsx
/lib
  supabase/{client,server,types}.ts
  auth.ts
  date.ts
  currency.ts                   # ₹ formatter
  validations/*.ts              # zod schemas per entity
  apify/{client,sync-talent,sync-influencer}.ts
/server/actions/{talents,brands,outreaches,campaigns,influencers,payments,settings,ig-sync}.ts
/db
  schema.sql
  seed.ts                       # optional sample fixtures (skipped initially per user)
```

## 12. Phased build plan

**Phase 1 — Foundation + talent CRM core (ship first)**
1. Repo, Tailwind v4, shadcn/ui, design tokens (zinc + indigo), Inter font.
2. Supabase project + schema migration + type generation.
3. Auth (magic link), profiles seeded with one admin.
4. App shell: sidebar, topbar, ⌘K skeleton, dark mode toggle.
5. Niches dictionary + Tags settings page.
6. Talents: list, detail tabs (Overview / Outreaches / Rate card / Contacts / Documents / Revenue), create/edit, contacts.
7. Brands: list, detail (POCs / Outreach history / Notes / Documents), create/edit.
8. Outreaches: list (table + kanban), detail with activity timeline, status transitions, follow-up enforcement on create.
9. Inbox (talent-side only at this stage) + activity-focused dashboard.
10. **Apify IG sync** for talents (button on detail header).
11. Daily email digest cron (Resend).
12. Deploy Phase 1 to Vercel.

**Phase 2 — Brand-managed side**
1. Managed brands: list + detail.
2. External influencers: list + detail + bulk-add UX. Apify IG sync button.
3. Campaigns: list + detail (Brief / Influencer outreach kanban+table / Deliverables tracker / Documents).
4. Campaign outreaches with activity timeline + per-row payment status.
5. Inbox: merge campaign-side follow-ups in.
6. Dashboard: add active campaigns row + per-user leaderboard now spans both sides.
7. Payments table polish (cross-side financial view).

**Phase 3 — Polish**
1. ⌘K command palette — jump-to-anything, create-anything.
2. Empty states, loading skeletons everywhere, shortcut overlay (`?`).
3. Tags polish, full-text search across notes.
4. Documents upload across all entity types tightened.
5. Mobile pass — every page usable on phone.

**Phase 4 — Talent + Brand portals**
1. Talent portal — they see their own outreaches (status only, redacted commercial detail if you choose), payments, documents.
2. Brand portal — managed-brand stakeholder sees their campaigns, influencer roster (read-only), deliverables progress.
3. Postgres RLS enabled; tighten Server Action authorization.

Each phase deploys independently. Don't start Phase 2 until Phase 1 is in production.

## 13. Acceptance bar

- Every list: filter + search + sort + j/k keyboard nav.
- Every form: zod-validated, optimistic where safe, server-action backed.
- Every detail view: opens as drawer from list; deep-linkable as full page.
- Status transitions auto-log activities.
- `next_followup_at` is **required** on outreach + campaign-outreach create.
- Daily digest cron actually sends.
- Apify sync writes both the target row AND an `ig_sync_runs` audit row.
- Mobile-responsive: tables collapse to stacked cards under `md:`.
- No console errors; no `any` in TypeScript; strict mode passes.
- Lighthouse desktop ≥ 90.
- Free-tier infra everywhere except the Apify token. Flag any ask that would require additional paid services.

## 14. Out of scope for v1

- Onboarding kits / media kits (any auto-generated talent documents)
- AI-generated outreach message drafting
- Email / WhatsApp / LinkedIn / IG API for *sending* anything (manual external sending only)
- Activity logging via API (manual entries only)
- Content calendar / post scheduling for managed brands
- Talent + brand external portals (Phase 4)
- Multi-tenant
- Razorpay / Stripe payment processing (track status only)
- Native mobile apps
- Advanced BI / cohort analytics

## 15. Operating principles

- Ask before assuming on: default commission %, "live" vs "posted" semantics for the `live` status, rate-limit threshold for Apify sync.
- Prefer fewer features done well over many half-finished.
- No emoji in UI unless asked.
- No comments in code unless they explain a non-obvious why.
- Ship Phase 1 to Vercel before starting Phase 2.

Build it like Linear: tight, fast, opinionated. When choosing between adding a feature and polishing an existing one, polish.
