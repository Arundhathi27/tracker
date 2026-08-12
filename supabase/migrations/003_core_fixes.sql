-- BudgetWise Core Fixes Supabase Migration
-- Restructures the database to match the new monthly budgeting workflow.

-- 1. Drop existing tables safely
drop table if exists transactions cascade;
drop table if exists budgets cascade;
drop table if exists categories cascade;
drop table if exists accounts cascade;

-- 2. payment_methods
create table if not exists payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null, -- e.g., 'UPI', 'Cash', 'Bank Account'
  created_at timestamptz not null default now()
);

alter table payment_methods enable row level security;

create policy "Users can manage own payment_methods"
  on payment_methods for all
  using (auth.uid() = user_id);

-- 3. monthly_budgets
create table if not exists monthly_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  month text not null, -- Format: 'YYYY-MM'
  total_amount decimal(12, 2) not null check (total_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month)
);

alter table monthly_budgets enable row level security;

create policy "Users can manage own monthly_budgets"
  on monthly_budgets for all
  using (auth.uid() = user_id);

create trigger update_monthly_budgets_updated_at
  before update on monthly_budgets
  for each row execute function update_updated_at_column();

-- 4. budget_categories
create table if not exists budget_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  monthly_budget_id uuid references monthly_budgets(id) on delete cascade not null,
  name text not null, -- e.g., 'Groceries', 'Rent'
  amount decimal(12, 2) not null check (amount > 0),
  spent decimal(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(monthly_budget_id, name)
);

alter table budget_categories enable row level security;

create policy "Users can manage own budget_categories"
  on budget_categories for all
  using (auth.uid() = user_id);

create trigger update_budget_categories_updated_at
  before update on budget_categories
  for each row execute function update_updated_at_column();

-- 5. transactions
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  amount decimal(12, 2) not null check (amount > 0),
  description text not null,
  date date not null default current_date,
  category_id uuid references budget_categories(id) on delete set null, -- Optional for income
  payment_method_id uuid references payment_methods(id) on delete restrict not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users can manage own transactions"
  on transactions for all
  using (auth.uid() = user_id);

create trigger update_transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at_column();

-- 6. Triggers for real-time tracking
create or replace function handle_core_transaction_insert()
returns trigger as $$
begin
  if new.type = 'expense' and new.category_id is not null then
    update budget_categories set spent = spent + new.amount where id = new.category_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_core_transaction_insert
  after insert on transactions
  for each row execute function handle_core_transaction_insert();

create or replace function handle_core_transaction_delete()
returns trigger as $$
begin
  if old.type = 'expense' and old.category_id is not null then
    update budget_categories set spent = spent - old.amount where id = old.category_id;
  end if;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_core_transaction_delete
  after delete on transactions
  for each row execute function handle_core_transaction_delete();

create or replace function handle_core_transaction_update()
returns trigger as $$
begin
  -- Revert old
  if old.type = 'expense' and old.category_id is not null then
    update budget_categories set spent = spent - old.amount where id = old.category_id;
  end if;

  -- Apply new
  if new.type = 'expense' and new.category_id is not null then
    update budget_categories set spent = spent + new.amount where id = new.category_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_core_transaction_update
  after update on transactions
  for each row execute function handle_core_transaction_update();

-- 7. Seed missing user names from Auth metadata on creation (Optional cleanup for Profiles)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Also seed default payment methods
  insert into public.payment_methods (user_id, name)
  values 
    (new.id, 'UPI'),
    (new.id, 'Cash'),
    (new.id, 'Bank Account'),
    (new.id, 'Debit Card'),
    (new.id, 'Credit Card'),
    (new.id, 'Wallet'),
    (new.id, 'Net Banking');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users cascade;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
