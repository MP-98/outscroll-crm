-- Optional seed data. Re-runnable.

-- Common niches for IG creators in India.
insert into niches (name) values
  ('Fashion'), ('Beauty'), ('Lifestyle'), ('Fitness'), ('Food'),
  ('Travel'), ('Tech'), ('Finance'), ('Comedy'), ('Education'),
  ('Parenting'), ('Auto'), ('Gaming'), ('Music'), ('Dance'),
  ('Cricket'), ('Bollywood'), ('Wellness'), ('Sustainability'), ('Photography')
on conflict (name) do nothing;

-- Note: To make abhay@theproductfolks.com an admin, sign in with that email
-- via the magic-link flow first (creates auth.users + profiles row), then run:
--   update profiles set role = 'admin', full_name = 'Abhay'
--   where email = 'abhay@theproductfolks.com';
-- The scripts/seed-admin.ts helper handles this for you.
