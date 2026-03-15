'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface MonthlyReportData {
    income: number;
    expenses: number;
    net_result: number;
    budget: {
        total: number;
        spent: number;
        remaining: number;
    };
    savings: {
        contribution: number;
        goal_target: number;
        goal_progress: number;
    };
    top_categories: Array<{
        category_id: string | null;
        name: string;
        icon: string;
        color: string;
        spent_eur: number;
    }>;
    category_breakdown: Array<{
        category_id: string | null;
        name: string;
        spent: number;
        percent: number;
        transaction_count: number;
        color: string;
        icon: string;
    }>;
    trend: {
        previous_net: number;
        direction: 'improving' | 'declining' | 'stable';
    };
}

export async function getMonthlyReport(p_month: string): Promise<MonthlyReportData | null> {
    const supabase = await getSupabaseServerClient();

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 2. Resolve household_id
    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single();

    if (!membership) return null;

    // 3. Call RPC
    const { data, error } = await supabase.rpc('get_monthly_financial_report', {
        p_household_id: membership.household_id,
        p_month: p_month
    });

    if (error) {
        console.error('Error fetching monthly report:', error);
        return null;
    }

    return data as MonthlyReportData;
}
