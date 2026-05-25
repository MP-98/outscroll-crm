-- v6 migration: free-form rates + management context on external_influencers.
-- Idempotent. Run once after v5-influencer-fields.sql.
--
-- Why:
--   1. Rates are now text so values like "20k", "2k", "2.5k–3k" work.
--   2. Reel rate splits into collab and non-collab (different pricing).
--   3. Ad rights + management context are new free-text fields.

-- 1. Convert rate columns from integer → text. Guarded so re-runs are no-ops.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_influencers'
      and column_name = 'rate_reel' and data_type = 'integer'
  ) then
    alter table external_influencers
      alter column rate_reel type text using rate_reel::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_influencers'
      and column_name = 'rate_story' and data_type = 'integer'
  ) then
    alter table external_influencers
      alter column rate_story type text using rate_story::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_influencers'
      and column_name = 'rate_post' and data_type = 'integer'
  ) then
    alter table external_influencers
      alter column rate_post type text using rate_post::text;
  end if;
end $$;

-- 2. New columns.
alter table external_influencers
  add column if not exists rate_reel_non_collab text;
alter table external_influencers
  add column if not exists ad_rights text;
alter table external_influencers
  add column if not exists is_managed boolean;
alter table external_influencers
  add column if not exists managed_by text;

comment on column external_influencers.rate_reel is
  'Free-text reel rate. Treated as the collab-reel rate.';
comment on column external_influencers.rate_reel_non_collab is
  'Free-text non-collab reel rate.';
comment on column external_influencers.is_managed is
  'Whether the creator is managed by an agency/manager. NULL = unknown.';
comment on column external_influencers.managed_by is
  'Who manages them (free text) — only meaningful when is_managed = true.';
