-- ============================================================
-- BudgetWise: Complete Database Fix
-- Run this in the Supabase SQL Editor.
-- Safe to run even if some tables already exist.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- ─── 2. payment_methods ───────────────────────────────────────────────────────
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='payment_methods' and policyname='Users can manage own payment_methods') then
    create policy "Users can manage own payment_methods" on public.payment_methods for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─── 3. monthly_budgets ───────────────────────────────────────────────────────
create table if not exists public.monthly_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  month text not null,                          -- Format: 'YYYY-MM'
  total_amount decimal(12,2) not null check (total_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month)
);

alter table public.monthly_budgets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='monthly_budgets' and policyname='Users can manage own monthly_budgets') then
    create policy "Users can manage own monthly_budgets" on public.monthly_budgets for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─── 4. budget_categories ─────────────────────────────────────────────────────
create table if not exists public.budget_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  monthly_budget_id uuid references public.monthly_budgets(id) on delete cascade not null,
  name text not null,
  amount decimal(12,2) not null check (amount > 0),   -- allocated amount
  spent decimal(12,2) not null default 0,             -- auto-updated by triggers
  icon text not null default 'HelpCircle',
  color text not null default '#6B4F3A',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(monthly_budget_id, name)
);

alter table public.budget_categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='budget_categories' and policyname='Users can manage own budget_categories') then
    create policy "Users can manage own budget_categories" on public.budget_categories for all using (auth.uid() = user_id);
  end if;
end $$;

-- Add icon/color columns if table already existed without them
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_categories' and column_name='icon') then
    alter table public.budget_categories add column icon text not null default 'HelpCircle';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='budget_categories' and column_name='color') then
    alter table public.budget_categories add column color text not null default '#6B4F3A';
  end if;
end $$;

-- ─── 5. transactions ──────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(12,2) not null check (amount > 0),
  description text not null default 'Expense',
  date date not null default current_date,
  category_id uuid references public.budget_categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,  -- nullable
  type text not null check (type in ('income','expense')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='transactions' and policyname='Users can manage own transactions') then
    create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
  end if;
end $$;

-- Make payment_method_id nullable if it was previously NOT NULL
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'payment_method_id'
      and is_nullable = 'NO'
  ) then
    alter table public.transactions alter column payment_method_id drop not null;
  end if;
end $$;

-- ─── 6. updated_at helper function ───────────────────────────────────────────
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── 7. updated_at triggers (safe, idempotent) ────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='update_profiles_updated_at') then
    create trigger update_profiles_updated_at
      before update on public.profiles for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname='update_monthly_budgets_updated_at') then
    create trigger update_monthly_budgets_updated_at
      before update on public.monthly_budgets for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname='update_budget_categories_updated_at') then
    create trigger update_budget_categories_updated_at
      before update on public.budget_categories for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname='update_transactions_updated_at') then
    create trigger update_transactions_updated_at
      before update on public.transactions for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- ─── 8. Budget spent tracking triggers ────────────────────────────────────────

create or replace function public.handle_core_transaction_insert()
returns trigger as $$
begin
  if new.type = 'expense' and new.category_id is not null then
    update public.budget_categories set spent = spent + new.amount where id = new.category_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_core_transaction_delete()
returns trigger as $$
begin
  if old.type = 'expense' and old.category_id is not null then
    update public.budget_categories set spent = spent - old.amount where id = old.category_id;
  end if;
  return old;
end;
$$ language plpgsql security definer;

create or replace function public.handle_core_transaction_update()
returns trigger as $$
begin
  if old.type = 'expense' and old.category_id is not null then
    update public.budget_categories set spent = spent - old.amount where id = old.category_id;
  end if;
  if new.type = 'expense' and new.category_id is not null then
    update public.budget_categories set spent = spent + new.amount where id = new.category_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='on_core_transaction_insert') then
    create trigger on_core_transaction_insert
      after insert on public.transactions for each row execute function public.handle_core_transaction_insert();
  end if;
  if not exists (select 1 from pg_trigger where tgname='on_core_transaction_delete') then
    create trigger on_core_transaction_delete
      after delete on public.transactions for each row execute function public.handle_core_transaction_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname='on_core_transaction_update') then
    create trigger on_core_transaction_update
      after update on public.transactions for each row execute function public.handle_core_transaction_update();
  end if;
end $$;

-- ─── 9. Auto-create profile + payment methods on signup ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  insert into public.payment_methods (user_id, name)
  values
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
$$ language plpgsql security definer;

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

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Verify tables exist:
-- select table_name from information_schema.tables where table_schema = 'public' order by table_name;
