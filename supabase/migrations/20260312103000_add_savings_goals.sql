-- Phase 11: Savings Goals Implementation

-- 1. Create saving_goals table
CREATE TABLE IF NOT EXISTS public.saving_goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name text NOT NULL,
    target_eur numeric(12, 2) NOT NULL CHECK (target_eur > 0),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_saving_goals_household ON public.saving_goals (household_id);

-- 3. Enforce one active goal per household
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_goal 
ON public.saving_goals (household_id) 
WHERE is_active = true;

-- 4. Enable RLS
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view savings goals in their household"
    ON public.saving_goals FOR SELECT
    USING (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage savings goals in their household"
    ON public.saving_goals FOR ALL
    USING (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ))
    WITH CHECK (household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    ));

-- 6. RPC Function for progress calculation
CREATE OR REPLACE FUNCTION get_savings_goal_progress(p_household_id uuid)
RETURNS TABLE (
    goal_name text,
    target_eur numeric,
    saved_eur numeric,
    remaining_eur numeric,
    percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal_record RECORD;
    v_saved_eur numeric;
BEGIN
    -- Get the active goal
    SELECT sg.name, sg.target_eur INTO v_goal_record
    FROM public.saving_goals sg
    WHERE sg.household_id = p_household_id AND sg.is_active = true
    LIMIT 1;

    -- If no goal, return NULLs
    IF v_goal_record IS NULL THEN
        RETURN QUERY SELECT 
            NULL::text, 
            NULL::numeric, 
            NULL::numeric, 
            NULL::numeric, 
            NULL::numeric;
        RETURN;
    END IF;

    -- Calculate saved amount from transactions with category 'Savings' (case-insensitive)
    SELECT COALESCE(SUM(t.amount_eur), 0) INTO v_saved_eur
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.household_id = p_household_id
      AND LOWER(c.name) = 'savings';

    -- Return the result
    RETURN QUERY SELECT 
        v_goal_record.name,
        v_goal_record.target_eur,
        v_saved_eur,
        GREATEST(v_goal_record.target_eur - v_saved_eur, 0),
        ROUND((v_saved_eur / v_goal_record.target_eur) * 100, 2);
END;
$$;
