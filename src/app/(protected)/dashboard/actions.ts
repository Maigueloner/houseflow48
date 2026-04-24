'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setExchangeRate(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const rate_to_eur = Number(formData.get('rate_to_eur'));
    const month = formData.get('month') as string;

    if (!rate_to_eur || rate_to_eur <= 0) {
        throw new Error('Invalid rate');
    }

    // Explicit logic: Check if exists
    const { data: existing } = await supabase
        .from('exchange_rates')
        .select('id')
        .eq('household_id', membership.household_id)
        .eq('currency', 'THB')
        .eq('month', month)
        .maybeSingle();

    if (existing) {
        // UPDATE
        const { error } = await supabase
            .from('exchange_rates')
            .update({ rate_to_eur })
            .eq('id', existing.id);
        if (error) throw new Error(error.message);
    } else {
        // INSERT
        const { error } = await supabase
            .from('exchange_rates')
            .insert({
                household_id: membership.household_id,
                currency: 'THB',
                rate_to_eur,
                month
            });
        if (error) throw new Error(error.message);
    }

    revalidatePath('/dashboard');
}

export async function createTransaction(formData: FormData) {
    const supabaseAction = await getSupabaseServerClient();
    const { data: { user: userAction } } = await supabaseAction.auth.getUser();
    if (!userAction) throw new Error('Not authenticated');

    const { data: membershipAction } = await supabaseAction
        .from('household_members')
        .select('household_id')
        .eq('user_id', userAction.id)
        .maybeSingle();

    if (!membershipAction) throw new Error('No household membership found');

    const account_id = formData.get('account_id') as string;
    if (!account_id) throw new Error('Account ID is required');

    const amount = Number(formData.get('amount'));
    if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than zero");
    }

    const type = formData.get('type') as 'income' | 'expense';
    const description = formData.get('description') as string | null;
    const transaction_date = formData.get('transaction_date') as string;
    const category_id = formData.get('category_id') as string;

    if (!category_id) throw new Error('Category is required');

    // Fetch category name for dual-write (TEXT fallback)
    const { data: cat } = await supabaseAction.from('categories').select('name').eq('id', category_id).single();
    if (!cat) throw new Error('Category not found');

    // Fetch account currency
    const { data: account } = await supabaseAction.from('accounts').select('currency_code').eq('id', account_id).single();
    if (!account) throw new Error('Account not found');

    let txCurrency = account.currency_code;
    let txExchangeRate = null;
    let txAmountEur = amount;

    if (txCurrency === 'THB') {
        const [yyyy, mm] = transaction_date.split('-');
        const firstOfMonth = `${yyyy}-${mm}-01`;

        const { data: rateData, error: rateError } = await supabaseAction
            .from('exchange_rates')
            .select('rate_to_eur')
            .eq('household_id', membershipAction.household_id)
            .eq('currency', 'THB')
            .eq('month', firstOfMonth)
            .maybeSingle();

        if (rateError || !rateData) {
            throw new Error('Monthly THB exchange rate not set.');
        }

        txExchangeRate = rateData.rate_to_eur;
        txAmountEur = amount / txExchangeRate;
    }

    const { error } = await supabaseAction.from('transactions').insert({
        household_id: membershipAction.household_id,
        account_id: account_id,
        amount: amount,
        type: type,
        category: cat.name,
        category_id: category_id,
        created_by: userAction.id,
        transaction_date: transaction_date,
        description: description,
        currency: txCurrency,
        exchange_rate: txExchangeRate,
        amount_eur: txAmountEur
    });

    if (error) throw new Error(error.message);

    // Phase 15: Handle Recurring Template Creation
    const is_recurring = formData.get('is_recurring') === 'on';
    if (is_recurring) {
        const frequency = formData.get('frequency') as 'monthly' | 'yearly';
        const day_of_month = Number(formData.get('day_of_month'));
        const month_of_year = frequency === 'yearly' ? Number(formData.get('month_of_year')) : null;

        const { error: recurError } = await supabaseAction.from('recurring_expenses').insert({
            id: crypto.randomUUID(), // Explicit UUID for reliability
            household_id: membershipAction.household_id,
            user_id: userAction.id,
            name: description || cat.name,
            amount_original: amount,
            currency_code: txCurrency,
            category_id: category_id,
            account_id: account_id,
            frequency: frequency,
            day_of_month: day_of_month,
            month_of_year: month_of_year,
            start_date: transaction_date
        });

        if (recurError) {
            console.error('Failed to create recurring template:', recurError);
        }
    }

    revalidatePath('/dashboard');
}

export async function confirmRecurringExpense(recurringId: string, amountOverride?: number, updateTemplate: boolean = false) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const { data, error } = await supabase.rpc('confirm_recurring_expense', {
        p_household_id: membership.household_id,
        p_recurring_id: recurringId,
        p_amount_override: amountOverride,
        p_update_template: updateTemplate
    });

    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard');
    return data; // Returns the new transaction UUID
}

export async function skipRecurringExpense(recurringId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('skip_recurring_expense', {
        p_recurring_id: recurringId
    });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function updateTransaction(formData: FormData) {
    const supabaseAction = await getSupabaseServerClient();
    const { data: { user: userAction } } = await supabaseAction.auth.getUser();
    if (!userAction) throw new Error('Not authenticated');

    const { data: membershipAction } = await supabaseAction
        .from('household_members')
        .select('household_id')
        .eq('user_id', userAction.id)
        .maybeSingle();

    if (!membershipAction) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    
    // Ownership validation
    const { data: existingTx } = await supabaseAction
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('household_id', membershipAction.household_id)
        .single();

    if (!existingTx) throw new Error('Transaction not found or unauthorized');

    const account_id = formData.get('account_id') as string;
    if (!account_id) throw new Error('Account ID is required');

    const amount = Number(formData.get('amount'));
    if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than zero");
    }

    const type = formData.get('type') as 'income' | 'expense';
    const description = formData.get('description') as string | null;
    const transaction_date = formData.get('transaction_date') as string;
    const category_id = formData.get('category_id') as string;

    const { data: cat } = await supabaseAction.from('categories').select('name').eq('id', category_id).single();
    if (!cat) throw new Error('Category not found');

    const { data: account } = await supabaseAction.from('accounts').select('currency_code').eq('id', account_id).single();
    if (!account) throw new Error('Account not found');

    let txCurrency = account.currency_code;
    let txExchangeRate = existingTx.exchange_rate;
    let txAmountEur = amount;

    // Check if account or month changed
    const oldMonth = existingTx.transaction_date.substring(0, 7);
    const newMonth = transaction_date.substring(0, 7);
    const accountChanged = existingTx.account_id !== account_id;
    const monthChanged = oldMonth !== newMonth;

    if (txCurrency === 'THB') {
        if (accountChanged || monthChanged || txExchangeRate === null) {
            // Need to fetch new rate
            const newFirstOfMonth = `${newMonth}-01`;
            const { data: rateData, error: rateError } = await supabaseAction
                .from('exchange_rates')
                .select('rate_to_eur')
                .eq('household_id', membershipAction.household_id)
                .eq('currency', 'THB')
                .eq('month', newFirstOfMonth)
                .maybeSingle();

            if (rateError || !rateData) {
                throw new Error('Monthly THB exchange rate not set for the new date.');
            }
            txExchangeRate = rateData.rate_to_eur;
        }
        txAmountEur = amount / txExchangeRate;
    } else {
        txExchangeRate = null;
        txAmountEur = amount;
    }

    const { error } = await supabaseAction.from('transactions').update({
        account_id: account_id,
        amount: amount,
        type: type,
        category: cat.name,
        category_id: category_id,
        transaction_date: transaction_date,
        description: description,
        currency: txCurrency,
        exchange_rate: txExchangeRate,
        amount_eur: txAmountEur
    }).eq('id', id).eq('household_id', membershipAction.household_id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function deleteTransaction(formData: FormData) {
    const supabaseAction = await getSupabaseServerClient();
    const { data: { user: userAction } } = await supabaseAction.auth.getUser();
    if (!userAction) throw new Error('Not authenticated');

    const { data: membershipAction } = await supabaseAction
        .from('household_members')
        .select('household_id')
        .eq('user_id', userAction.id)
        .maybeSingle();

    if (!membershipAction) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    
    // Validate ownership before delete
    const { data: existingTx } = await supabaseAction
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('household_id', membershipAction.household_id)
        .single();
        
    if (!existingTx) throw new Error('Transaction not found or unauthorized');

    const { error } = await supabaseAction
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('household_id', membershipAction.household_id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function copyPreviousMonthBudgets(formData: FormData) {
    const supabaseAction = await getSupabaseServerClient();
    const { data: { user: userAction } } = await supabaseAction.auth.getUser();
    if (!userAction) throw new Error('Not authenticated');

    const { data: membershipAction } = await supabaseAction
        .from('household_members')
        .select('household_id')
        .eq('user_id', userAction.id)
        .maybeSingle();

    if (!membershipAction) throw new Error('No household membership found');

    const target_month = formData.get('target_month') as string;
    
    const { error } = await supabaseAction.rpc('copy_previous_month_budgets', {
        p_household_id: membershipAction.household_id,
        p_target_month: target_month
    });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function updateRecurringTemplate(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const amount = Number(formData.get('amount'));
    const category_id = formData.get('category_id') as string;
    const account_id = formData.get('account_id') as string;
    const day_of_month = Number(formData.get('day_of_month'));
    const month_of_year = formData.get('month_of_year') ? Number(formData.get('month_of_year')) : null;

    const { error } = await supabase.rpc('update_recurring_template', {
        p_recurring_id: id,
        p_household_id: membership.household_id,
        p_name: name,
        p_amount_original: amount,
        p_category_id: category_id,
        p_account_id: account_id,
        p_day_of_month: day_of_month,
        p_month_of_year: month_of_year
    });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function toggleRecurringTemplate(recurringId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const { error } = await supabase.rpc('toggle_recurring_template', {
        p_recurring_id: recurringId,
        p_household_id: membership.household_id
    });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function deleteRecurringTemplate(recurringId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const { error } = await supabase.rpc('delete_recurring_template', {
        p_recurring_id: recurringId,
        p_household_id: membership.household_id
    });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function createAccount(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const name = (formData.get('name') as string)?.trim();
    const currency_code = formData.get('currency_code') as 'EUR' | 'THB';
    const initial_balance = formData.get('initial_balance') ? Number(formData.get('initial_balance')) : 0;

    if (!name || name.length < 1) throw new Error('Name is required');
    if (!['EUR', 'THB'].includes(currency_code)) throw new Error('Invalid currency');
    if (isNaN(initial_balance) || initial_balance < 0) throw new Error('Invalid initial balance');

    // 1. Insert Account
    const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
            household_id: membership.household_id,
            name: name,
            type: 'checking',
            currency_code: currency_code
        })
        .select()
        .single();

    if (accountError) throw new Error(accountError.message);

    // 2. Create Initial Balance Transaction (if balance > 0)
    if (initial_balance > 0) {
        let txExchangeRate = null;
        let txAmountEur = initial_balance;

        if (currency_code === 'THB') {
            const today = new Date().toISOString().split('T')[0];
            const [yyyy, mm] = today.split('-');
            const firstOfMonth = `${yyyy}-${mm}-01`;

            const { data: rateData, error: rateError } = await supabase
                .from('exchange_rates')
                .select('rate_to_eur')
                .eq('household_id', membership.household_id)
                .eq('currency', 'THB')
                .eq('month', firstOfMonth)
                .maybeSingle();

            if (rateError || !rateData) {
                throw new Error('Monthly THB exchange rate not set for the current month.');
            }

            txExchangeRate = rateData.rate_to_eur;
            txAmountEur = initial_balance / txExchangeRate;
        }

        const { error: txError } = await supabase.from('transactions').insert({
            household_id: membership.household_id,
            account_id: newAccount.id,
            amount: initial_balance,
            type: 'income',
            category: 'Income', 
            category_id: null,
            created_by: user.id,
            transaction_date: new Date().toISOString().split('T')[0],
            description: 'Initial account balance',
            currency: currency_code,
            exchange_rate: txExchangeRate,
            amount_eur: txAmountEur
        });

        if (txError) throw new Error(txError.message);
    }

    revalidatePath('/dashboard');
}

export async function renameAccount(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();

    if (!name || name.length < 1) throw new Error('Name is required');

    // Ownership validation
    const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', id)
        .eq('household_id', membership.household_id)
        .maybeSingle();

    if (!existing) throw new Error('Account not found or unauthorized');

    const { error } = await supabase
        .from('accounts')
        .update({ name })
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
}

export async function deleteAccount(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;

    // Ownership validation
    const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', id)
        .eq('household_id', membership.household_id)
        .maybeSingle();

    if (!existing) throw new Error('Account not found or unauthorized');

    // 1. Transaction safety check
    const { count: txCount, error: txCheckError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', id)
        .eq('household_id', membership.household_id);

    if (txCheckError) throw new Error(txCheckError.message);
    if (txCount && txCount > 0) throw new Error('Cannot delete account with existing transactions');

    // 2. Recurring template safety check
    const { count: recurCount, error: recurCheckError } = await supabase
        .from('recurring_expenses')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', id)
        .eq('household_id', membership.household_id);

    if (recurCheckError) throw new Error(recurCheckError.message);
    if (recurCount && recurCount > 0) throw new Error('Cannot delete account linked to recurring templates');

    // Delete
    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
}

export async function createCategory(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const name = (formData.get('name') as string)?.trim();
    const iconRaw = (formData.get('icon') as string)?.trim();
    const icon = iconRaw || 'tag';

    if (!name || name.length < 1) throw new Error('Name is required');
    if (name.length > 80) throw new Error('Name must be 80 characters or fewer');

    // Duplicate check (case-insensitive)
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', membership.household_id)
        .ilike('name', name)
        .maybeSingle();

    if (existing) throw new Error('A category with this name already exists');

    const { error } = await supabase
        .from('categories')
        .insert({ household_id: membership.household_id, name, icon });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function renameCategory(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const iconRaw = (formData.get('icon') as string)?.trim();
    const icon = iconRaw || 'tag';

    if (!name || name.length < 1) throw new Error('Name is required');

    // Ownership check
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .eq('household_id', membership.household_id)
        .maybeSingle();

    if (!existing) throw new Error('Category not found or unauthorized');

    // Duplicate name check (excluding self)
    const { data: duplicate } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', membership.household_id)
        .ilike('name', name)
        .neq('id', id)
        .maybeSingle();

    if (duplicate) throw new Error('A category with this name already exists');

    const { error } = await supabase
        .from('categories')
        .update({ name, icon })
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function deleteCategory(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;

    // Ownership check
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .eq('household_id', membership.household_id)
        .maybeSingle();

    if (!existing) throw new Error('Category not found or unauthorized');

    // Transaction safety check
    const { count: txCount, error: txError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('household_id', membership.household_id);

    if (txError) throw new Error(txError.message);
    if (txCount && txCount > 0)
        throw new Error('Cannot delete a category that is used by existing transactions');

    // Recurring template safety check
    const { count: recurCount, error: recurError } = await supabase
        .from('recurring_expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('household_id', membership.household_id);

    if (recurError) throw new Error(recurError.message);
    if (recurCount && recurCount > 0)
        throw new Error('Cannot delete a category linked to recurring templates');

    // Budget safety check
    const { count: budgetCount, error: budgetError } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('household_id', membership.household_id);

    if (budgetError) throw new Error(budgetError.message);
    if (budgetCount && budgetCount > 0)
        throw new Error('Cannot delete a category linked to existing budgets');

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function createSavingsGoal(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const name = (formData.get('name') as string)?.trim();
    const target_eur = Number(formData.get('target_eur'));
    const set_active = formData.get('set_active') === 'on';

    if (!name) throw new Error('Name is required');
    if (isNaN(target_eur) || target_eur <= 0) throw new Error('Target amount must be greater than 0');

    // If set_active is true, or if this is the first goal, it should be active
    let isActive = set_active;
    
    // Check if any other goal exists
    const { count } = await supabase
        .from('saving_goals')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', membership.household_id);
    
    if (count === 0) {
        isActive = true;
    }

    if (isActive) {
        // Deactivate others first to avoid unique constraint violation
        await supabase
            .from('saving_goals')
            .update({ is_active: false })
            .eq('household_id', membership.household_id)
            .eq('is_active', true);
    }

    const { data: newGoal, error } = await supabase
        .from('saving_goals')
        .insert({
            household_id: membership.household_id,
            name,
            target_eur,
            is_active: isActive
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
}

export async function updateSavingsGoal(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const target_eur = Number(formData.get('target_eur'));

    if (!name) throw new Error('Name is required');
    if (isNaN(target_eur) || target_eur <= 0) throw new Error('Target amount must be greater than 0');

    const { error } = await supabase
        .from('saving_goals')
        .update({ name, target_eur })
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
}

export async function deleteSavingsGoal(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const id = formData.get('id') as string;

    // Safety check: Cannot delete active goal
    const { data: goal } = await supabase
        .from('saving_goals')
        .select('is_active')
        .eq('id', id)
        .eq('household_id', membership.household_id)
        .single();

    if (!goal) throw new Error('Goal not found');
    if (goal.is_active) throw new Error('Cannot delete the active savings goal. Activate a different goal first.');

    const { error } = await supabase
        .from('saving_goals')
        .delete()
        .eq('id', id)
        .eq('household_id', membership.household_id);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
}

export async function setActiveSavingsGoal(goalId: string) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    // 1. Deactivate any currently active goals in the household first
    const { error: deactivateError } = await supabase
        .from('saving_goals')
        .update({ is_active: false })
        .eq('household_id', membership.household_id)
        .eq('is_active', true);

    if (deactivateError) throw new Error(deactivateError.message);

    // 2. Activate the selected goal
    const { error: activateError } = await supabase
        .from('saving_goals')
        .update({ is_active: true })
        .eq('id', goalId)
        .eq('household_id', membership.household_id);

    if (activateError) throw new Error(activateError.message);

    revalidatePath('/dashboard');
}

export async function setCategoryBudget(formData: FormData) {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const category_id = formData.get('category_id') as string;
    const month = formData.get('month') as string;
    const budgetRaw = formData.get('budget_eur');
    
    // If budget input is empty, delete the budget entry
    if (budgetRaw === null || budgetRaw === '') {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('household_id', membership.household_id)
            .eq('category_id', category_id)
            .eq('month', month);
        
        if (error) throw new Error(error.message);
    } else {
        const budget_eur = Number(budgetRaw);
        if (isNaN(budget_eur) || budget_eur < 0) {
            throw new Error('Invalid budget amount');
        }

        const { error } = await supabase
            .from('budgets')
            .upsert({
                household_id: membership.household_id,
                category_id,
                month,
                budget_eur
            }, {
                onConflict: 'household_id,category_id,month'
            });

        if (error) throw new Error(error.message);
    }

    revalidatePath('/dashboard');
}

export async function getCategoryTransactions(
    category_id: string | null,
    start_date: string,
    end_date: string
) {
    if (!category_id) return [];

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!membership) throw new Error('No household membership found');

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', membership.household_id)
        .eq('category_id', category_id)
        .gte('transaction_date', start_date)
        .lt('transaction_date', end_date)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
}
