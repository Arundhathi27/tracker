-- BudgetWise Supabase Migrations
-- Run these in order via the Supabase SQL editor or CLI

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─── Categories ───────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#6366F1',
  type text not null check (type in ('income', 'expense', 'both')),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "Users can view own and system categories"
  on categories for select
  using (auth.uid() = user_id or is_system = true);

create policy "Users can manage own categories"
  on categories for all
  using (auth.uid() = user_id);

-- ─── Budgets ──────────────────────────────────────────────────────────────
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  amount decimal(12, 2) not null check (amount > 0),
  spent decimal(12, 2) not null default 0,
  period text not null check (period in ('daily', 'weekly', 'monthly', 'yearly')),
  category_id uuid references categories(id) on delete set null,
  color text not null default '#6366F1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table budgets enable row level security;

create policy "Users can manage own budgets"
  on budgets for all
  using (auth.uid() = user_id);

-- ─── Transactions ─────────────────────────────────────────────────────────
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  budget_id uuid references budgets(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount decimal(12, 2) not null check (amount > 0),
  description text not null,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users can manage own transactions"
  on transactions for all
  using (auth.uid() = user_id);

-- ─── Trigger: Auto-update updated_at ─────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_budgets_updated_at
  before update on budgets
  for each row execute function update_updated_at_column();

create trigger update_transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at_column();
