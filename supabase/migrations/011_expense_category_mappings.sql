-- Migration 011: Expense Category Mappings for Smart Category Assignment
create table if not exists public.expense_category_mappings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keyword text not null,
  category_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, keyword)
);

alter table public.expense_category_mappings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'expense_category_mappings' and policyname = 'Users can manage own expense_category_mappings') then
    create policy "Users can manage own expense_category_mappings" on public.expense_category_mappings for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists expense_category_mappings_user_kw_idx on public.expense_category_mappings(user_id, keyword);
