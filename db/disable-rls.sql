-- Phase 1: disable RLS on every CRM table.
-- The spec defers RLS to Phase 4 when external (talent/brand) portals ship.
-- Run this once after schema.sql against your Supabase project.

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
