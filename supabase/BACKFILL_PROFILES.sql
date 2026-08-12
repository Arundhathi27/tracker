-- =============================================================
-- BUDGETWISE: Backfill missing profiles
-- =============================================================
-- Run this in Supabase SQL Editor.
--
-- This inserts a profiles row for every auth.users row that
-- doesn't already have one — fixing the FK violation.
-- =============================================================

insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Also backfill default payment methods for those users
insert into public.payment_methods (user_id, name)
select u.id, pm.name
from auth.users u
cross join (
  values ('UPI'), ('Cash'), ('Bank Account'), ('Debit Card'), ('Credit Card'), ('Wallet'), ('Net Banking')
) as pm(name)
left join public.payment_methods existing
  on existing.user_id = u.id and existing.name = pm.name
where existing.id is null;
