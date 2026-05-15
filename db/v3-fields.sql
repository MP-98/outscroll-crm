-- v3 migration: nullable talent_id + nullable next_followup_at + sidebar default change.
-- Idempotent. Run once after phase2-fields.sql.
--
-- Why:
--   1. Lets you log an outreach for a brand you haven't paired with a talent yet
--      (status='prospected', talent_id NULL, brand_id set, follow-up date set).
--   2. Lets you mark an outreach as "no follow-up needed" — e.g., when the brand
--      said no or never replied — so it disappears from the Inbox.
--   3. New sidebar default for new users is Outreaches + Influencers only.
--      Existing users keep their current effective access via the backfill below.

-- 1. Drop NOT NULL on talent_id (prospect-stage outreaches).
alter table outreaches alter column talent_id drop not null;

-- 2. Drop NOT NULL on next_followup_at (allow "No follow-up" terminal state).
alter table outreaches alter column next_followup_at drop not null;
alter table campaign_outreaches alter column next_followup_at drop not null;

-- 3. Backfill allowed_sidebar so existing users don't lose access when the
--    default changes in code. Seed admin is exempt (it always returns all tabs).
update profiles
   set allowed_sidebar = array[
     'dashboard','inbox','talents','outreaches',
     'managed_brands','campaigns','influencers'
   ]
 where allowed_sidebar is null
   and role = 'admin'
   and coalesce(is_seed_admin, false) = false;

update profiles
   set allowed_sidebar = array['dashboard','inbox','talents','outreaches']
 where allowed_sidebar is null
   and role = 'member';
