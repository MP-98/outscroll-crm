-- v4 migration: adds 'not_contacted' as a new first stage on outreaches.
-- Idempotent. Run once after v3-fields.sql.
--
-- New pipeline:
--   not_contacted → prospected → contacted → in_conversation → brief_received
--                 → negotiating → confirmed → live → paid
--   branches: lost, on_hold

alter table outreaches drop constraint if exists outreaches_status_check;
alter table outreaches
  add constraint outreaches_status_check
  check (status in (
    'not_contacted','prospected','contacted','in_conversation','brief_received',
    'negotiating','confirmed','live','paid','lost','on_hold'
  ));
