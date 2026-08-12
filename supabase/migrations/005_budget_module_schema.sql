-- Add 'icon' and 'color' to budget_categories to support Phase 2 Budget Module

-- 1. Add 'icon' column safely
alter table public.budget_categories 
add column if not exists icon text not null default 'circle';

-- 2. Add 'color' column safely
alter table public.budget_categories 
add column if not exists color text not null default '#6B4F3A';
