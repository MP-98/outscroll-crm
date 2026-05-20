-- v5 migration: creator-analysis fields on external_influencers.
-- Universal — applies to every creator across every niche.
-- Idempotent. Run once after v4-fields.sql.

alter table external_influencers add column if not exists content_pov text;
alter table external_influencers add column if not exists format_mix text;
alter table external_influencers add column if not exists languages text[] default '{}';
alter table external_influencers add column if not exists tone_tags text[] default '{}';
alter table external_influencers add column if not exists production_quality text;
alter table external_influencers add column if not exists audience_age_band_est text;
alter table external_influencers add column if not exists brand_collabs_visible text;
alter table external_influencers add column if not exists red_flags text;
alter table external_influencers add column if not exists casting_notes text;
alter table external_influencers add column if not exists events_other text;
alter table external_influencers add column if not exists analysis_depth text default 'not_analyzed';
alter table external_influencers add column if not exists last_analyzed_at date;
alter table external_influencers add column if not exists analyzed_by text;

-- Constrained vocabularies (single-value fields). tone_tags is a free-ish
-- array validated in the app layer, not via a DB check.
alter table external_influencers drop constraint if exists ext_inf_format_mix_check;
alter table external_influencers add constraint ext_inf_format_mix_check
  check (format_mix is null or format_mix in ('reel_heavy','photo_heavy','mixed'));

alter table external_influencers drop constraint if exists ext_inf_production_quality_check;
alter table external_influencers add constraint ext_inf_production_quality_check
  check (production_quality is null or production_quality in ('high','mid','low'));

alter table external_influencers drop constraint if exists ext_inf_audience_age_check;
alter table external_influencers add constraint ext_inf_audience_age_check
  check (audience_age_band_est is null or audience_age_band_est in ('18-24','25-34','35-44','mixed'));

alter table external_influencers drop constraint if exists ext_inf_analysis_depth_check;
alter table external_influencers add constraint ext_inf_analysis_depth_check
  check (analysis_depth is null or analysis_depth in ('not_analyzed','tier_1','tier_2'));

create index if not exists external_influencers_analysis_depth_idx
  on external_influencers(analysis_depth);
create index if not exists external_influencers_city_idx on external_influencers(lower(city));
