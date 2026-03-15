-- Phase 14: Add Category Metadata and Optimization Index

-- 1. Add styling columns to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. Add performance index for date-range filtering with categories
CREATE INDEX IF NOT EXISTS idx_transactions_household_date_category 
ON public.transactions (household_id, transaction_date, category_id);
