-- =============================================================
-- BUDGETWISE – COMPLETE DATABASE INITIALIZATION
-- =============================================================
-- Paste this ENTIRE script into:
--   Supabase Dashboard → SQL Editor → New Query → Run (F5)
--
-- Safe to run on a completely empty database.
-- Creates all tables, RLS policies, triggers, and functions.
-- =============================================================

-- ── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- =============================================================
-- TABLE 1: profiles
-- Mirrors auth.users. Created automatically on sign-up.
-- =============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  currency    text not null default 'INR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- =============================================================
-- TABLE 2: payment_methods
-- Referenced by transactions (nullable). Seeded on sign-up.
-- =============================================================
create table if not exists public.payment_methods (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'payment_methods' and policyname = 'Users can manage own payment_methods') then
    create policy "Users can manage own payment_methods" on public.payment_methods for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);

-- =============================================================
-- TABLE 3: monthly_budgets
-- One per user per month (YYYY-MM). E.g. '2026-07'.
-- =============================================================
create table if not exists public.monthly_budgets (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  month        text not null,               -- 'YYYY-MM'
  total_amount decimal(12,2) not null check (total_amount > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id, month)
);

alter table public.monthly_budgets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'monthly_budgets' and policyname = 'Users can manage own monthly_budgets') then
    create policy "Users can manage own monthly_budgets" on public.monthly_budgets for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists monthly_budgets_user_month_idx on public.monthly_budgets(user_id, month);

-- =============================================================
-- TABLE 4: budget_categories
-- Each category belongs to one monthly budget.
-- `amount`  = allocated limit  (exposed as allocated_amount in app)
-- `spent`   = auto-updated by triggers (exposed as spent_amount in app)
-- `icon`    = Lucide icon name, e.g. 'ShoppingBag'
-- `color`   = hex color, e.g. '#C65A5A'
-- =============================================================
create table if not exists public.budget_categories (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  monthly_budget_id  uuid not null references public.monthly_budgets(id) on delete cascade,
  name               text not null,
  amount             decimal(12,2) not null check (amount > 0),
  spent              decimal(12,2) not null default 0,
  icon               text not null default 'HelpCircle',
  color              text not null default '#6B4F3A',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique(monthly_budget_id, name)
);

alter table public.budget_categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'budget_categories' and policyname = 'Users can manage own budget_categories') then
    create policy "Users can manage own budget_categories" on public.budget_categories for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists budget_categories_budget_idx on public.budget_categories(monthly_budget_id);
create index if not exists budget_categories_user_idx   on public.budget_categories(user_id);

-- =============================================================
-- TABLE 5: transactions
-- Stores all expenses (and optionally income).
-- payment_method_id is nullable (app no longer requires it).
-- category_id links to budget_categories (for expenses).
-- =============================================================
create table if not exists public.transactions (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  amount             decimal(12,2) not null check (amount > 0),
  description        text not null default 'Expense',
  date               date not null default current_date,
  category_id        uuid references public.budget_categories(id) on delete set null,
  payment_method_id  uuid references public.payment_methods(id) on delete set null,
  type               text not null check (type in ('income', 'expense')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.transactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'transactions' and policyname = 'Users can manage own transactions') then
    create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists transactions_user_idx     on public.transactions(user_id);
create index if not exists transactions_date_idx     on public.transactions(date desc);
create index if not exists transactions_category_idx on public.transactions(category_id);
create index if not exists transactions_type_idx     on public.transactions(type);

-- =============================================================
-- FUNCTION: updated_at auto-stamp
-- =============================================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- TRIGGERS: updated_at on all stamped tables
-- =============================================================
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at
      before update on public.profiles
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_monthly_budgets_updated_at') then
    create trigger trg_monthly_budgets_updated_at
      before update on public.monthly_budgets
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_budget_categories_updated_at') then
    create trigger trg_budget_categories_updated_at
      before update on public.budget_categories
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_transactions_updated_at') then
    create trigger trg_transactions_updated_at
      before update on public.transactions
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- =============================================================
-- FUNCTIONS + TRIGGERS: Auto-update budget_categories.spent
-- When an expense transaction is inserted/updated/deleted,
-- the linked category's `spent` column updates automatically.
-- =============================================================

-- INSERT → add to spent
create or replace function public.trg_fn_tx_insert()
returns trigger language plpgsql security definer as $$
begin
  if new.type = 'expense' and new.category_id is not null then
    update public.budget_categories
    set spent = spent + new.amount
    where id = new.category_id;
  end if;
  return new;
end;
$$;

-- DELETE → subtract from spent
create or replace function public.trg_fn_tx_delete()
returns trigger language plpgsql security definer as $$
begin
  if old.type = 'expense' and old.category_id is not null then
    update public.budget_categories
    set spent = greatest(0, spent - old.amount)
    where id = old.category_id;
  end if;
  return old;
end;
$$;

-- UPDATE → reverse old, apply new
create or replace function public.trg_fn_tx_update()
returns trigger language plpgsql security definer as $$
begin
  -- Reverse old effect
  if old.type = 'expense' and old.category_id is not null then
    update public.budget_categories
    set spent = greatest(0, spent - old.amount)
    where id = old.category_id;
  end if;
  -- Apply new effect
  if new.type = 'expense' and new.category_id is not null then
    update public.budget_categories
    set spent = spent + new.amount
    where id = new.category_id;
  end if;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_tx_insert') then
    create trigger trg_tx_insert
      after insert on public.transactions
      for each row execute function public.trg_fn_tx_insert();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_tx_delete') then
    create trigger trg_tx_delete
      after delete on public.transactions
      for each row execute function public.trg_fn_tx_delete();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_tx_update') then
    create trigger trg_tx_update
      after update on public.transactions
      for each row execute function public.trg_fn_tx_update();
  end if;
end $$;

-- =============================================================
-- FUNCTION + TRIGGER: Auto-create profile + seed payment methods
-- Fires after a new user signs up via Supabase Auth.
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Create profile row
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  -- Seed default payment methods
  insert into public.payment_methods (user_id, name) values
    (new.id, 'UPI'),
    (new.id, 'Cash'),
    (new.id, 'Bank Account'),
    (new.id, 'Debit Card'),
    (new.id, 'Credit Card'),
    (new.id, 'Wallet'),
    (new.id, 'Net Banking')
  on conflict do nothing;

  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- =============================================================
-- VERIFY (optional – uncomment to check after running)
-- =============================================================
-- select table_name, row_security
-- from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;
