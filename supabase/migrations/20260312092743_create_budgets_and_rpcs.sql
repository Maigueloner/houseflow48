CREATE TABLE public.budgets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    month date NOT NULL CHECK (date_trunc('month', month) = month), 
    budget_eur numeric(12, 2) NOT NULL CHECK (budget_eur >= 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (household_id, category_id, month)
);

CREATE INDEX idx_budgets_household_category_month ON public.budgets (household_id, category_id, month);
CREATE INDEX idx_budgets_household_month ON public.budgets (household_id, month);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets in their household"
    ON public.budgets FOR SELECT
    USING (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage budgets in their household"
    ON public.budgets FOR ALL
    USING (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ));

CREATE OR REPLACE FUNCTION get_monthly_budget_totals(
    p_household_id uuid,
    p_month date
)
RETURNS TABLE (
    total_budget numeric,
    total_spent numeric,
    total_remaining numeric,
    total_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH raw_budgets AS (
        SELECT COALESCE(SUM(budget_eur), 0) AS t_budget 
        FROM public.budgets 
        WHERE household_id = p_household_id AND month = p_month
    ),
    raw_expenses AS (
        SELECT COALESCE(SUM(t.amount_eur), 0) AS t_spent
        FROM public.transactions t
        WHERE t.household_id = p_household_id
          AND t.type = 'expense'
          AND date_trunc('month', t.transaction_date)::date = p_month
    )
    SELECT 
        rb.t_budget AS total_budget,
        re.t_spent AS total_spent,
        (rb.t_budget - re.t_spent) AS total_remaining,
        CASE 
            WHEN rb.t_budget > 0 THEN ROUND((re.t_spent / rb.t_budget) * 100, 2)
            ELSE 0 
        END AS total_percent
    FROM raw_budgets rb
    CROSS JOIN raw_expenses re;
END;
$$;

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
    WITH raw_budgets AS (
        SELECT 
            b.category_id,
            c.name AS category_name,
            b.budget_eur
        FROM public.budgets b
        JOIN public.categories c ON b.category_id = c.id
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
        rb.category_id,
        rb.category_name,
        rb.budget_eur,
        COALESCE(re.spent_eur, 0) AS spent_eur,
        (rb.budget_eur - COALESCE(re.spent_eur, 0)) AS remaining_eur,
        CASE 
            WHEN rb.budget_eur > 0 THEN ROUND((COALESCE(re.spent_eur, 0) / rb.budget_eur) * 100, 2)
            ELSE 0 
        END AS percent_used
    FROM raw_budgets rb
    LEFT JOIN raw_expenses re ON rb.category_id = re.category_id
    ORDER BY percent_used DESC;
END;
$$;

CREATE OR REPLACE FUNCTION copy_previous_month_budgets(
    p_household_id uuid,
    p_target_month date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prev_month date;
BEGIN
    v_prev_month := p_target_month - interval '1 month';

    INSERT INTO public.budgets (household_id, category_id, month, budget_eur)
    SELECT 
        household_id, 
        category_id, 
        p_target_month, 
        budget_eur
    FROM public.budgets
    WHERE household_id = p_household_id
      AND month = v_prev_month
    ON CONFLICT (household_id, category_id, month) DO NOTHING;
END;
$$;
