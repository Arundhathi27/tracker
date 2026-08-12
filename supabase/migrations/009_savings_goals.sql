-- ============================================================
-- BudgetWise: Savings Goals Table
-- ============================================================

create table if not exists public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_amount decimal(12,2) not null check (target_amount > 0),
  current_amount decimal(12,2) not null default 0 check (current_amount >= 0),
  target_date date,
  notes text,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.savings_goals enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='savings_goals' and policyname='Users can manage own savings goals') then
    create policy "Users can manage own savings goals" on public.savings_goals for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─── 2. updated_at triggers ──────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='update_savings_goals_updated_at') then
    create trigger update_savings_goals_updated_at
      before update on public.savings_goals for each row execute function public.update_updated_at_column();
  end if;
end $$;
