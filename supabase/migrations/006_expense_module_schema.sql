-- Make payment_method_id optional in transactions for Phase 3 Expense Module

alter table public.transactions 
alter column payment_method_id drop not null;
