-- Migration: per-user tab permissions + seed-admin flag.
-- Idempotent. Run once after schema.sql.

alter table profiles add column if not exists is_seed_admin boolean default false;
alter table profiles add column if not exists can_configure_team boolean default true;
alter table profiles add column if not exists allowed_sidebar text[] default null;

comment on column profiles.is_seed_admin is
  'The original/owner admin. Has all permissions; cannot be demoted by anyone except themselves via SQL.';
comment on column profiles.can_configure_team is
  'Only meaningful for role=admin. If false, this admin cannot change others'' tab permissions or roles. Seed admin always can.';
comment on column profiles.allowed_sidebar is
  'Only meaningful for role=member. NULL means use defaults (dashboard, inbox, talents, outreaches). Array of sidebar keys.';
