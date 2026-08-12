-- ============================================================
-- BudgetWise: Income Table
-- ============================================================

-- ─── 1. income table ────────────────────────────────────────────────────────
create table if not exists public.income (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal(12,2) not null check (amount > 0),
  source text not null default 'Other',
  description text not null default 'Income',
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.income enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='income' and policyname='Users can manage own income') then
    create policy "Users can manage own income" on public.income for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─── 2. updated_at triggers ──────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='update_income_updated_at') then
    create trigger update_income_updated_at
      before update on public.income for each row execute function public.update_updated_at_column();
  end if;
end $$;
