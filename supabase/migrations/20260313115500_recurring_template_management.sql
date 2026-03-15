-- Phase 15.2: Recurring Template Management

-- 1. Create update_recurring_template RPC
CREATE OR REPLACE FUNCTION public.update_recurring_template(
    p_recurring_id uuid,
    p_household_id uuid,
    p_name text,
    p_amount_original numeric,
    p_category_id uuid,
    p_account_id uuid,
    p_day_of_month integer,
    p_month_of_year integer DEFAULT NULL
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_template record;
BEGIN
    -- 1. Explicit Data Validation
    IF p_amount_original <= 0 THEN
        RAISE EXCEPTION 'Invalid amount value';
    END IF;

    IF p_day_of_month < 1 OR p_day_of_month > 31 THEN
        RAISE EXCEPTION 'Invalid day_of_month value';
    END IF;

    -- 2. Household & Existence Check
    SELECT * INTO v_template FROM public.recurring_expenses 
    WHERE id = p_recurring_id AND household_id = p_household_id;
    
    IF NOT FOUND THEN RETURN NULL; END IF;

    -- 3. Yearly Month Validation
    IF v_template.frequency = 'yearly' THEN
        IF p_month_of_year IS NULL OR p_month_of_year < 1 OR p_month_of_year > 12 THEN
            RAISE EXCEPTION 'Invalid month_of_year value';
        END IF;
    END IF;

    -- 4. Atomic Update
    UPDATE public.recurring_expenses
    SET name = p_name,
        amount_original = p_amount_original,
        category_id = p_category_id,
        account_id = p_account_id,
        day_of_month = p_day_of_month,
        month_of_year = CASE 
            WHEN frequency = 'yearly' THEN p_month_of_year 
            ELSE month_of_year 
        END
    WHERE id = p_recurring_id AND household_id = p_household_id;

    RETURN p_recurring_id;
END;
$$;

-- 2. Create toggle_recurring_template RPC
CREATE OR REPLACE FUNCTION public.toggle_recurring_template(
    p_recurring_id uuid,
    p_household_id uuid
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_new_status boolean;
    v_old_status boolean;
BEGIN
    -- 1. Existence and Auth Check
    SELECT is_active INTO v_old_status FROM public.recurring_expenses 
    WHERE id = p_recurring_id AND household_id = p_household_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_new_status := NOT v_old_status;

    -- 2. Update with Activation Safety
    UPDATE public.recurring_expenses
    SET is_active = v_new_status,
        last_triggered_date = CASE 
            WHEN v_new_status = true AND v_old_status = false THEN CURRENT_DATE 
            ELSE last_triggered_date 
        END
    WHERE id = p_recurring_id AND household_id = p_household_id;

    RETURN v_new_status;
END;
$$;

-- 3. Create delete_recurring_template RPC
CREATE OR REPLACE FUNCTION public.delete_recurring_template(
    p_recurring_id uuid,
    p_household_id uuid
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.recurring_expenses
    WHERE id = p_recurring_id AND household_id = p_household_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    RETURN TRUE;
END;
$$;

-- 4. Update confirm_recurring_expense RPC
CREATE OR REPLACE FUNCTION public.confirm_recurring_expense(
    p_household_id uuid,
    p_recurring_id uuid,
    p_amount_override numeric DEFAULT NULL,
    p_update_template boolean DEFAULT FALSE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_template record;
    v_exchange_rate numeric;
    v_amount_original numeric;
    v_amount_eur numeric;
    v_transaction_date date := CURRENT_DATE;
    v_transaction_id uuid;
BEGIN
    -- 1. Atomic Guard
    UPDATE public.recurring_expenses
    SET last_confirmed_date = CURRENT_DATE,
        last_triggered_date = CURRENT_DATE
    WHERE id = p_recurring_id
      AND household_id = p_household_id
      AND (last_confirmed_date IS NULL OR last_confirmed_date < CURRENT_DATE)
      AND is_active = true
    RETURNING * INTO v_template;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Final Amount
    v_amount_original := COALESCE(p_amount_override, v_template.amount_original);

    -- 3. Template Update (Phase 15.2 Extension)
    IF p_update_template AND p_amount_override IS NOT NULL THEN
        UPDATE public.recurring_expenses
        SET amount_original = p_amount_override
        WHERE id = p_recurring_id;
    END IF;

    -- 4. FX Fetch with Safety
    IF v_template.currency_code = 'EUR' THEN
        v_exchange_rate := 1.0;
    ELSE
        SELECT rate_to_eur INTO v_exchange_rate
        FROM public.exchange_rates
        WHERE household_id = p_household_id
          AND currency = v_template.currency_code
          AND month = date_trunc('month', CURRENT_DATE)
        LIMIT 1;
    END IF;

    IF v_exchange_rate IS NULL THEN
        RAISE EXCEPTION 'Missing exchange rate for currency %', v_template.currency_code;
    END IF;

    -- 5. Calculate EUR
    v_amount_eur := v_amount_original / v_exchange_rate;

    -- 6. Insert Transaction
    INSERT INTO public.transactions (
        household_id,
        account_id,
        category_id,
        created_by,
        type,
        amount,           
        amount_original,  
        currency,         
        exchange_rate,
        amount_eur,
        transaction_date,
        category         
    ) 
    SELECT 
        p_household_id,
        v_template.account_id,
        v_template.category_id,
        auth.uid(),
        'expense',
        v_amount_original, 
        v_amount_original,
        v_template.currency_code,
        v_exchange_rate,
        v_amount_eur,
        v_transaction_date,
        c.name
    FROM public.categories c
    WHERE c.id = v_template.category_id
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$;
