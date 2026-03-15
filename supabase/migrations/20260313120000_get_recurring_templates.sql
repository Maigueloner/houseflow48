-- Phase 15.2: Add RPC to fetch all recurring templates with metadata

CREATE OR REPLACE FUNCTION public.get_recurring_templates(
    p_household_id uuid
)
RETURNS TABLE (
    id uuid,
    name text,
    amount_original numeric,
    currency_code text,
    account_id uuid,
    account_name text,
    category_id uuid,
    category_name text,
    frequency text,
    day_of_month integer,
    month_of_year integer,
    is_active boolean,
    last_triggered_date date,
    last_confirmed_date date
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        re.id,
        re.name,
        re.amount_original,
        re.currency_code,
        re.account_id,
        a.name as account_name,
        re.category_id,
        c.name as category_name,
        re.frequency,
        re.day_of_month,
        re.month_of_year,
        re.is_active,
        re.last_triggered_date,
        re.last_confirmed_date
    FROM public.recurring_expenses re
    JOIN public.accounts a ON re.account_id = a.id
    JOIN public.categories c ON re.category_id = c.id
    WHERE re.household_id = p_household_id
    ORDER BY re.is_active DESC, re.name ASC;
END;
$$;
