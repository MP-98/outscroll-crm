-- Outscroll CRM — Phase 1 schema
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / OR REPLACE where possible.
-- Phase 4 portal scaffolding included now to avoid migrations later.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  role text check (role in ('admin','member','talent','brand')) default 'member',
  linked_talent_id uuid,
  linked_brand_id uuid,
  linked_managed_brand_id uuid,
  -- Permissions (Phase 1 tab access; see db/permissions.sql)
  is_seed_admin boolean default false,
  can_configure_team boolean default true,
  allowed_sidebar text[] default null,
  created_at timestamptz default now()
);
-- For existing projects, add columns idempotently:
alter table profiles add column if not exists is_seed_admin boolean default false;
alter table profiles add column if not exists can_configure_team boolean default true;
alter table profiles add column if not exists allowed_sidebar text[] default null;
create index if not exists profiles_role_idx on profiles(role);

-- Auto-create a profile row when a user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- niches dictionary
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists niches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- talents
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists talents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  ig_handle text not null,
  ig_followers integer,
  avg_reel_views integer,
  ig_metrics_synced_at timestamptz,
  niches text[] default '{}',
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
create index if not exists talents_ig_handle_idx on talents(lower(ig_handle));
create index if not exists talents_status_idx on talents(status);
create index if not exists talents_manager_id_idx on talents(manager_id);
create index if not exists talents_niches_gin on talents using gin (niches);

create table if not exists talent_contacts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talents(id) on delete cascade,
  kind text check (kind in ('phone','whatsapp','ig_link','ig_dm','email','other')) not null,
  value text not null,
  is_primary boolean default false,
  label text
);
create index if not exists talent_contacts_talent_id_idx on talent_contacts(talent_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- brands + POCs
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  ig_handle text,
  website text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists brands_name_idx on brands(lower(name));

create table if not exists brand_pocs (
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
create index if not exists brand_pocs_brand_id_idx on brand_pocs(brand_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- outreaches (talent ↔ brand)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists outreaches (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid references talents(id) on delete cascade,
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
  next_followup_at date,
  owner_id uuid references profiles(id),
  notes text,
  tags text[] default '{}',
  lost_reason text,
  paid_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Existing-project safety: relax NOT NULL on talent_id + next_followup_at
-- (see db/v3-fields.sql for the standalone migration).
alter table outreaches alter column talent_id drop not null;
alter table outreaches alter column next_followup_at drop not null;
create index if not exists outreaches_status_idx on outreaches(status);
create index if not exists outreaches_next_followup_at_idx on outreaches(next_followup_at);
create index if not exists outreaches_talent_id_idx on outreaches(talent_id);
create index if not exists outreaches_brand_id_idx on outreaches(brand_id);
create index if not exists outreaches_owner_id_idx on outreaches(owner_id);

-- Extended fields (see db/outreach-fields.sql for the standalone migration).
alter table outreaches add column if not exists reached_out_at date;
alter table outreaches add column if not exists negotiated_amount integer;
alter table outreaches add column if not exists direction text;
alter table outreaches drop constraint if exists outreaches_direction_check;
alter table outreaches
  add constraint outreaches_direction_check
  check (direction in ('inbound','outbound') or direction is null);

create table if not exists outreach_activities (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid not null references outreaches(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text check (channel in ('ig_dm','linkedin','whatsapp','email','call','note','status_change','other')) not null,
  direction text check (direction in ('outbound','inbound','internal')),
  summary text not null,
  attachment_url text,
  author_id uuid references profiles(id)
);
create index if not exists outreach_activities_outreach_id_idx on outreach_activities(outreach_id);
create index if not exists outreach_activities_author_id_idx on outreach_activities(author_id);
create index if not exists outreach_activities_occurred_at_idx on outreach_activities(occurred_at desc);

-- Auto-log status_change activity on update.
create or replace function public.log_outreach_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into outreach_activities (outreach_id, channel, direction, summary, author_id)
    values (new.id, 'status_change', 'internal', old.status || ' → ' || new.status, new.owner_id);
  end if;
  return new;
end;
$$;

drop trigger if exists outreaches_status_change_trg on outreaches;
create trigger outreaches_status_change_trg
  after update of status on outreaches
  for each row execute function public.log_outreach_status_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- managed_brands + external_influencers + campaigns (Phase 2; schema only here)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists managed_brands (
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

create table if not exists external_influencers (
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
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now()
);
create index if not exists external_influencers_ig_handle_idx on external_influencers(lower(ig_handle));
create index if not exists external_influencers_niches_gin on external_influencers using gin (niches);

create table if not exists campaigns (
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

create table if not exists campaign_outreaches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  external_influencer_id uuid references external_influencers(id),
  talent_id uuid references talents(id),
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
create index if not exists campaign_outreaches_campaign_id_idx on campaign_outreaches(campaign_id);
create index if not exists campaign_outreaches_status_idx on campaign_outreaches(status);
create index if not exists campaign_outreaches_next_followup_at_idx on campaign_outreaches(next_followup_at);
create index if not exists campaign_outreaches_owner_id_idx on campaign_outreaches(owner_id);

-- Phase 2: deliverable_done flag (see db/phase2-fields.sql).
alter table campaign_outreaches
  add column if not exists deliverable_done boolean default false;
-- v3: allow no-follow-up (see db/v3-fields.sql).
alter table campaign_outreaches alter column next_followup_at drop not null;

-- Auto-log status_change activity on campaign_outreaches update.
create or replace function public.log_campaign_outreach_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into campaign_outreach_activities (campaign_outreach_id, channel, direction, summary, author_id)
    values (new.id, 'status_change', 'internal', old.status || ' → ' || new.status, new.owner_id);
  end if;
  return new;
end;
$$;

drop trigger if exists campaign_outreaches_status_change_trg on campaign_outreaches;
create trigger campaign_outreaches_status_change_trg
  after update of status on campaign_outreaches
  for each row execute function public.log_campaign_outreach_status_change();

create table if not exists campaign_outreach_activities (
  id uuid primary key default gen_random_uuid(),
  campaign_outreach_id uuid not null references campaign_outreaches(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  channel text not null,
  direction text,
  summary text not null,
  attachment_url text,
  author_id uuid references profiles(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- payments / documents / reminders / ig_sync_runs
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists payments (
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

create table if not exists documents (
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

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  outreach_id uuid references outreaches(id),
  campaign_outreach_id uuid references campaign_outreaches(id),
  due_at timestamptz not null,
  message text,
  done boolean default false,
  created_at timestamptz default now()
);

create table if not exists ig_sync_runs (
  id uuid primary key default gen_random_uuid(),
  target_kind text check (target_kind in ('talent','external_influencer')) not null,
  target_id uuid not null,
  ig_handle text not null,
  apify_run_id text,
  status text check (status in ('queued','running','succeeded','failed')) default 'queued',
  followers integer,
  avg_reel_views integer,
  reels_sampled integer,
  cost_credits numeric(10,4),
  error_message text,
  triggered_by uuid references profiles(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);
create index if not exists ig_sync_runs_created_at_idx on ig_sync_runs(created_at desc);
create index if not exists ig_sync_runs_target_idx on ig_sync_runs(target_kind, target_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger applied to mutable tables
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'talents','brands','outreaches','managed_brands','campaigns',
      'campaign_outreaches'
    ])
  loop
    execute format('drop trigger if exists %I_updated_at on %I', t, t);
    execute format(
      'create trigger %I_updated_at before update on %I for each row execute function public.touch_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- documents storage bucket
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 1: disable RLS. Spec defers RLS to Phase 4 (when external portals ship).
-- Without this, user sessions can't read their own rows because Supabase enables
-- RLS by default on new tables and we ship no policies in v1.
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles                     disable row level security;
alter table niches                       disable row level security;
alter table talents                      disable row level security;
alter table talent_contacts              disable row level security;
alter table brands                       disable row level security;
alter table brand_pocs                   disable row level security;
alter table outreaches                   disable row level security;
alter table outreach_activities          disable row level security;
alter table managed_brands               disable row level security;
alter table external_influencers         disable row level security;
alter table campaigns                    disable row level security;
alter table campaign_outreaches          disable row level security;
alter table campaign_outreach_activities disable row level security;
alter table payments                     disable row level security;
alter table documents                    disable row level security;
alter table reminders                    disable row level security;
alter table ig_sync_runs                 disable row level security;
