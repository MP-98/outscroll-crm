-- v8 migration: drop unused analysis fields from external_influencers.
-- Idempotent. Run once after v7-text-metrics.sql.
--
-- Why: content_pov, casting_notes and analysis_depth were removed from the
-- influencer form / detail page. Keeping the columns around invites stale data
-- and confuses anyone reading the schema. Drop them cleanly.
--
-- Heads up: any values previously stored in these three columns are removed
-- when this runs. If you want to preserve them, export the rows first.

alter table external_influencers drop constraint if exists ext_inf_analysis_depth_check;
drop index if exists external_influencers_analysis_depth_idx;

alter table external_influencers drop column if exists content_pov;
alter table external_influencers drop column if exists casting_notes;
alter table external_influencers drop column if exists analysis_depth;
