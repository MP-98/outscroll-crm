-- Migration: add reached_out_at, negotiated_amount, direction to outreaches.
-- Idempotent. Run once after schema.sql on any existing project.

alter table outreaches add column if not exists reached_out_at date;
alter table outreaches add column if not exists negotiated_amount integer;
alter table outreaches add column if not exists direction text;

-- Drop the constraint if it exists so re-runs don't fail, then re-add.
alter table outreaches drop constraint if exists outreaches_direction_check;
alter table outreaches
  add constraint outreaches_direction_check
  check (direction in ('inbound','outbound') or direction is null);

-- Backfill: existing rows are assumed outbound (we proactively pitch).
update outreaches set direction = 'outbound' where direction is null;

comment on column outreaches.reached_out_at is
  'Date of first contact with this brand for this talent. Independent of created_at.';
comment on column outreaches.negotiated_amount is
  'Mid-negotiation number, between proposed_amount and agreed_amount.';
comment on column outreaches.direction is
  'Who initiated: inbound (brand reached us) or outbound (we pitched).';
