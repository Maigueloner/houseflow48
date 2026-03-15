-- Phase 14: Monthly Financial Report RPC

CREATE OR REPLACE FUNCTION get_monthly_financial_report(p_household_id uuid, p_month date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report json;
    v_start_date date := p_month;
    v_end_date date := p_month + interval '1 month';
    v_prev_start_date date := p_month - interval '1 month';
    v_prev_end_date date := p_month;
BEGIN
    WITH 
    -- 1. Current Month Transactions
    current_tx AS (
        SELECT amount_eur, type, category_id
        FROM public.transactions
        WHERE household_id = p_household_id
          AND transaction_date >= v_start_date
          AND transaction_date < v_end_date
    ),
    -- 2. Previous Month Transactions
    prev_tx AS (
        SELECT amount_eur, type
        FROM public.transactions
        WHERE household_id = p_household_id
          AND transaction_date >= v_prev_start_date
          AND transaction_date < v_prev_end_date
    ),
    -- 3. Monthly Income/Expense/Net
    current_totals AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount_eur ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_eur ELSE 0 END), 0) as expenses
        FROM current_tx
    ),
    prev_totals AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount_eur ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_eur ELSE 0 END), 0) as expenses
        FROM prev_tx
    ),
    -- 4. Budget Performance
    budget_summary AS (
        SELECT 
            COALESCE(SUM(budget_eur), 0) as budget_total
        FROM public.budgets
        WHERE household_id = p_household_id
          AND month = v_start_date
    ),
    -- 5. Savings Stats
    savings_stats AS (
        SELECT 
            COALESCE(SUM(t.amount_eur), 0) as contribution
        FROM current_tx t
        JOIN public.categories c ON t.category_id = c.id
        WHERE LOWER(c.name) = 'savings'
    ),
    -- 6. Active Savings Goal
    active_goal AS (
        SELECT name, target_eur
        FROM public.saving_goals
        WHERE household_id = p_household_id AND is_active = true
        LIMIT 1
    ),
    -- 7. Category Breakdown (Aggregated)
    category_summary AS (
        SELECT 
            c.id as category_id,
            COALESCE(c.name, 'Uncategorized') as name,
            COALESCE(c.icon, 'help-circle') as icon,
            COALESCE(c.color, '#6b7280') as color,
            SUM(t.amount_eur) as spent,
            COUNT(*) as transaction_count
        FROM current_tx t
        LEFT JOIN public.categories c ON t.category_id = c.id
        WHERE t.type = 'expense'
        GROUP BY c.id, c.name, c.icon, c.color
    ),
    -- Total expense for percent calculation (using root expense value for safety)
    total_exp AS (
        SELECT expenses FROM current_totals
    ),
    category_breakdown_all AS (
        SELECT 
            category_id,
            name,
            icon,
            color,
            spent,
            transaction_count,
            CASE WHEN te.expenses > 0 THEN ROUND((spent / te.expenses) * 100, 2) ELSE 0 END as percent,
            ROW_NUMBER() OVER(ORDER BY spent DESC) as rank
        FROM category_summary, total_exp te
    ),
    top_6 AS (
        SELECT category_id, name, icon, color, spent, percent, transaction_count
        FROM category_breakdown_all
        WHERE rank <= 6
    ),
    other AS (
        SELECT 
            NULL::uuid as category_id,
            'Other' as name,
            'more-horizontal' as icon,
            '#9ca3af' as color,
            SUM(spent) as spent,
            CASE WHEN (SELECT expenses FROM total_exp) > 0 THEN ROUND((SUM(spent) / (SELECT expenses FROM total_exp)) * 100, 2) ELSE 0 END as percent,
            SUM(transaction_count) as transaction_count
        FROM category_breakdown_all
        WHERE rank > 6
        HAVING COUNT(*) > 0
    ),
    final_breakdown AS (
        SELECT * FROM top_6
        UNION ALL
        SELECT * FROM other
    )

    -- Assemble Report JSON
    SELECT json_build_object(
        'income', ct.income,
        'expenses', ct.expenses,
        'net_result', (ct.income - ct.expenses),
        'budget', json_build_object(
            'total', bs.budget_total,
            'spent', ct.expenses,
            'remaining', GREATEST(bs.budget_total - ct.expenses, 0)
        ),
        'savings', json_build_object(
            'contribution', ss.contribution,
            'goal_target', COALESCE(ag.target_eur, 0),
            'goal_progress', CASE WHEN COALESCE(ag.target_eur, 0) > 0 THEN ROUND((ss.contribution / ag.target_eur) * 100, 2) ELSE 0 END
        ),
        'top_categories', (
            SELECT json_agg(json_build_object(
                'category_id', category_id,
                'name', name,
                'icon', icon,
                'color', color,
                'spent_eur', spent
            )) FROM top_6
        ),
        'category_breakdown', (
            SELECT json_agg(json_build_object(
                'category_id', category_id,
                'name', name,
                'icon', icon,
                'color', color,
                'spent', spent,
                'percent', percent,
                'transaction_count', transaction_count
            )) FROM final_breakdown
        ),
        'trend', json_build_object(
            'previous_net', (pt.income - pt.expenses),
            'direction', CASE 
                WHEN (ct.income - ct.expenses) > (pt.income - pt.expenses) THEN 'improving'
                WHEN (ct.income - ct.expenses) < (pt.income - pt.expenses) THEN 'declining'
                ELSE 'stable'
            END
        )
    ) INTO v_report
    FROM current_totals ct, prev_totals pt, budget_summary bs, savings_stats ss
    LEFT JOIN active_goal ag ON true;

    RETURN COALESCE(v_report, json_build_object(
        'income', 0, 'expenses', 0, 'net_result', 0,
        'budget', json_build_object('total', 0, 'spent', 0, 'remaining', 0),
        'savings', json_build_object('contribution', 0, 'goal_target', 0, 'goal_progress', 0),
        'top_categories', '[]'::json,
        'category_breakdown', '[]'::json,
        'trend', json_build_object('previous_net', 0, 'direction', 'stable')
    ));
END;
$$;
