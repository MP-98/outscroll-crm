-- Phase 2 migration: adds deliverable_done to campaign_outreaches
-- so the Deliverables Tracker tab can mark commitments independently of
-- pipeline status (a row can be 'live' but the deliverable still pending review).
-- Idempotent. Run once after schema.sql.

alter table campaign_outreaches
  add column if not exists deliverable_done boolean default false;

comment on column campaign_outreaches.deliverable_done is
  'Tracker flag: has the influencer fulfilled their deliverable? Independent of pipeline status.';

-- Auto-log status_change activity on campaign_outreaches (mirrors outreaches).
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
