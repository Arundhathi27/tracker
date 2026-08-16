-- =============================================================
-- BUDGETWISE – FIXED EXPENSES MODULE SCHEMA
-- =============================================================

-- TABLE 1: fixed_expenses
-- Stores user-configured fixed expense templates (e.g. Rent, EB Bill)
create table if not exists public.fixed_expenses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,                 -- e.g. 'Rent', 'EB Bill', 'Water'
  category_name text not null,                -- e.g. 'Rent', 'Electricity', 'Utilities'
  keyword       text not null default '',      -- optional keyword for matching description
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.fixed_expenses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'fixed_expenses' and policyname = 'Users can manage own fixed_expenses') then
    create policy "Users can manage own fixed_expenses" on public.fixed_expenses for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists fixed_expenses_user_idx on public.fixed_expenses(user_id);

-- TABLE 2: fixed_expense_overrides (manual checkmarks when no transaction exists)
create table if not exists public.fixed_expense_overrides (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  fixed_expense_id uuid not null references public.fixed_expenses(id) on delete cascade,
  year             integer not null,
  month            integer not null check (month between 1 and 12),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, fixed_expense_id, year, month)
);

alter table public.fixed_expense_overrides enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'fixed_expense_overrides' and policyname = 'Users can manage own fixed_expense_overrides') then
    create policy "Users can manage own fixed_expense_overrides" on public.fixed_expense_overrides for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists fixed_expense_overrides_idx on public.fixed_expense_overrides(user_id, fixed_expense_id, year, month);
