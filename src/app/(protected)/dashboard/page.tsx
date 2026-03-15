export const dynamic = "force-dynamic";

import MonthNavigation from '@/components/dashboard/MonthNavigation';
import { redirect } from 'next/navigation';
import ExchangeRateAlert from '@/components/dashboard/ExchangeRateAlert';
import QuickAddTransaction from '@/components/dashboard/QuickAddTransaction';
import TransactionList from '@/components/dashboard/TransactionList';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HeroCard from '@/components/dashboard/HeroCard';
import AnalyticsAccordion from '@/components/dashboard/AnalyticsAccordion';
import BudgetCard from '@/components/dashboard/BudgetCard';
import MonthlyReportCard from '@/components/dashboard/MonthlyReportCard';
import CategorySpendingChart from '@/components/charts/CategorySpendingChart';
import SavingsGoalCard from '@/components/dashboard/SavingsGoalCard';
import FinancialTrendChart from '@/components/dashboard/FinancialTrendChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import RecurringTemplatesCard from '@/components/dashboard/RecurringTemplatesCard';
import AccountsCard from '@/components/dashboard/AccountsCard';
import CategoriesCard from '@/components/dashboard/CategoriesCard';
import RecurringExpenseReminderCard from '@/components/dashboard/RecurringExpenseReminderCard';
import FloatingQuickAdd from '@/components/dashboard/FloatingQuickAdd';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getMonthDateRange } from '@/lib/utils/date';

interface DashboardPageProps {
    searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams;
    const { start_date, end_date, normalizedMonth, normalizedMonthDay1 } = getMonthDateRange(params.month);

    const supabase = await getSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Fetch Membership and Household info
    const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select(`
            household_id,
            households (
                id,
                base_currency
            )
        `)
        .eq('user_id', user!.id)
        .maybeSingle();

    if (membershipError || !membership) {
        return <div>No household found</div>;
    }


    // 5. Main Dashboard Data Fetching (Strictly via RPCs for financial logic)
    // Using allSettled to ensure dashboard resilience even if individual queries fail.
    const results = await Promise.allSettled([
        supabase.rpc('get_monthly_summary', {
            p_household_id: membership.household_id,
            p_start_date: start_date,
            p_end_date: end_date
        }),
        supabase.rpc('get_monthly_category_breakdown', {
            p_household_id: membership.household_id,
            p_start_date: start_date,
            p_end_date: end_date
        }),
        supabase.from('accounts').select('*').eq('household_id', membership.household_id),
        supabase.from('transactions')
            .select('*')
            .eq('household_id', membership.household_id)
            .gte('transaction_date', start_date)
            .lt('transaction_date', end_date)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(10),
        supabase.from('categories').select('*').eq('household_id', membership.household_id).order('name'),
        supabase.rpc('get_monthly_comparison', {
            p_household_id: membership.household_id,
            p_month: start_date
        }),
        supabase.rpc('get_financial_trends', {
            p_household_id: membership.household_id,
            p_limit: 6
        }),
        supabase.rpc('get_monthly_budget_totals', {
            p_household_id: membership.household_id,
            p_month: start_date
        }),
        supabase.rpc('get_monthly_budget_categories', {
            p_household_id: membership.household_id,
            p_month: start_date
        }),
        supabase.rpc('get_savings_goal_progress', {
            p_household_id: membership.household_id
        }),
        supabase.rpc('get_monthly_financial_report', {
            p_household_id: membership.household_id,
            p_month: start_date
        }),
        supabase.rpc('get_due_recurring_expenses', {
            p_household_id: membership.household_id
        }),
        supabase.rpc('get_recurring_templates', {
            p_household_id: membership.household_id
        }),
        supabase.from('saving_goals')
            .select('id, name, target_eur, is_active')
            .eq('household_id', membership.household_id)
            .order('created_at', { ascending: true }),
        // Parallelize exchange rate lookups
        supabase
            .from('exchange_rates')
            .select('rate_to_eur')
            .eq('household_id', membership.household_id)
            .eq('currency', 'THB')
            .eq('month', normalizedMonthDay1)
            .maybeSingle(),
        supabase
            .from('exchange_rates')
            .select('rate_to_eur')
            .eq('household_id', membership.household_id)
            .eq('currency', 'THB')
            .lt('month', normalizedMonthDay1)
            .order('month', { ascending: false })
            .limit(1)
            .maybeSingle()
    ]);

    // Data Extraction Helper with null safety
    const getData = <T,>(idx: number): T | null => {
        const res = results[idx];
        if (res.status === 'fulfilled') {
            const val = res.value as any;
            return val.data ?? null;
        }
        return null;
    };

    const summary = getData<any[]>(0)?.[0] || { total_income: 0, total_expense: 0, net_result: 0 };
    const breakdown = getData<any[]>(1);
    const accounts = getData<any[]>(2);
    const transactions = getData<any[]>(3);
    const categories = getData<any[]>(4);
    
    const comparison = getData<any[]>(5)?.[0] || { 
        income_current: 0, 
        income_delta_percent: 0, 
        expense_current: 0, 
        expense_delta_percent: 0, 
        net_current: 0,
        net_delta_percent: 0,
        savings_rate_current: 0
    };
    const trends = getData<any[]>(6) || [];
    const budgetTotals = getData<any[]>(7)?.[0] || null;
    const budgetCategories = getData<any[]>(8) || [];
    const savingsGoalProgress = getData<any[]>(9)?.[0] || null;
    const monthlyReport = getData<any>(10) || null;
    const dueExpenses = getData<any[]>(11) || [];
    const recurringTemplates = getData<any[]>(12) || [];
    const allGoals = getData<any[]>(13) || [];

    // Exchange Rates Logic
    const currentMonthRateData = getData<any>(14);
    const lastMonthRateData = getData<any>(15);

    const currentRate = currentMonthRateData?.rate_to_eur || null;
    const lastMonthRate = lastMonthRateData?.rate_to_eur || null;

    const showFxAlert = currentRate === null;

    return (
        <DashboardLayout
            quickAddNode={
                <QuickAddTransaction
                    accounts={accounts || []}
                    categories={categories || []}
                    start_date={start_date}
                />
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <MonthNavigation currentMonth={normalizedMonth} />
                    {dueExpenses.length > 0 && (
                        <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {dueExpenses.length} Pending {dueExpenses.length === 1 ? 'Reminder' : 'Reminders'}
                        </div>
                    )}
                </div>

                {showFxAlert && (
                    <ExchangeRateAlert
                        monthString={normalizedMonth}
                        monthDate={normalizedMonthDay1}
                        currentRate={currentRate}
                        lastMonthRate={lastMonthRate}
                    />
                )}

                {dueExpenses.length > 0 && (
                    <RecurringExpenseReminderCard dueExpenses={dueExpenses} />
                )}
                
                <HeroCard 
                    income={comparison.income_current}
                    expenses={comparison.expense_current}
                    net={comparison.net_current}
                    savingsRate={comparison.savings_rate_current}
                />

                {monthlyReport && (
                    <CategorySpendingChart 
                        breakdown={monthlyReport.category_breakdown} 
                        totalExpenses={monthlyReport.expenses} 
                    />
                )}

                <SavingsGoalCard 
                    progress={savingsGoalProgress} 
                    allGoals={allGoals}
                />

                <TransactionList 
                    title={`Recent Transactions (${normalizedMonth})`}
                    transactions={transactions || []} 
                    accounts={accounts || []} 
                    categories={categories || []} 
                />

                <AnalyticsAccordion>
                    <BudgetCard
                        monthString={normalizedMonth}
                        monthDateDay1={start_date}
                        totals={budgetTotals}
                        categories={budgetCategories}
                    />

                    {monthlyReport && (
                         <MonthlyReportCard report={monthlyReport} />
                    )}

                    <FinancialTrendChart data={trends} />
                    <CategoryChart categories={breakdown || []} />
                    
                    <RecurringTemplatesCard 
                        templates={recurringTemplates} 
                        accounts={accounts || []} 
                        categories={categories || []} 
                    />
                    <AccountsCard accounts={accounts || []} />
                    <CategoriesCard categories={categories || []} />
                </AnalyticsAccordion>
            </div>
            <FloatingQuickAdd />
        </DashboardLayout>
    );
}