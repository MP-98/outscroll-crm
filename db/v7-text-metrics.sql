-- v7 migration: free-form follower / avg-reel-view counts on external_influencers.
-- Idempotent. Run once after v6-rates-and-management.sql.
--
-- Why: lets you type "1.6K", "12K", "1.2L" etc. instead of raw integers.
-- The Apify sync still works — it writes the numeric value as its string form.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_influencers'
      and column_name = 'ig_followers' and data_type = 'integer'
  ) then
    alter table external_influencers
      alter column ig_followers type text using ig_followers::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'external_influencers'
      and column_name = 'avg_reel_views' and data_type = 'integer'
  ) then
    alter table external_influencers
      alter column avg_reel_views type text using avg_reel_views::text;
  end if;
end $$;
