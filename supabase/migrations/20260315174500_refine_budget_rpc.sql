-- Refine get_monthly_budget_categories to return ALL categories for a household
-- and join them with budgets if they exist for the given month.

CREATE OR REPLACE FUNCTION get_monthly_budget_categories(
    p_household_id uuid,
    p_month date
)
RETURNS TABLE (
    category_id uuid,
    category_name text,
    budget_eur numeric,
    spent_eur numeric,
    remaining_eur numeric,
    percent_used numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH all_categories AS (
        SELECT id as c_id, name as c_name
        FROM public.categories
        WHERE household_id = p_household_id
    ),
    raw_budgets AS (
        SELECT 
            b.category_id,
            b.budget_eur
        FROM public.budgets b
        WHERE b.household_id = p_household_id
          AND b.month = p_month
    ),
    raw_expenses AS (
        SELECT 
            t.category_id,
            COALESCE(SUM(t.amount_eur), 0) AS spent_eur
        FROM public.transactions t
        WHERE t.household_id = p_household_id
          AND t.type = 'expense'
          AND date_trunc('month', t.transaction_date)::date = p_month
        GROUP BY t.category_id
    )
    SELECT 
        ac.c_id AS category_id,
        ac.c_name AS category_name,
        rb.budget_eur,
        COALESCE(re.spent_eur, 0) AS spent_eur,
        CASE 
            WHEN rb.budget_eur IS NOT NULL THEN (rb.budget_eur - COALESCE(re.spent_eur, 0))
            ELSE NULL
        END AS remaining_eur,
        CASE 
            WHEN rb.budget_eur > 0 THEN ROUND((COALESCE(re.spent_eur, 0) / rb.budget_eur) * 100, 2)
            ELSE 0 
        END AS percent_used
    FROM all_categories ac
    LEFT JOIN raw_budgets rb ON ac.c_id = rb.category_id
    LEFT JOIN raw_expenses re ON ac.c_id = re.category_id
    ORDER BY budget_eur DESC NULLS LAST, category_name ASC;
END;
$$;
