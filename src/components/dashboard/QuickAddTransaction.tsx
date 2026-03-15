'use client';

import { useState, useEffect, useRef } from 'react';
import { createTransaction } from '@/app/(protected)/dashboard/actions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Check, Plus, X } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcon';
import { toast } from 'sonner';

export interface Account {
    id: string;
    name: string;
    currency_code: string;
}

interface QuickAddTransactionProps {
    accounts: Account[];
    categories: any[];
    start_date: string;
}

export default function QuickAddTransaction({ accounts, categories, start_date }: QuickAddTransactionProps) {
    const [isPending, setIsPending] = useState(false);
    const amountInputRef = useRef<HTMLInputElement>(null);

    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

    // Load defaults from localStorage or fallback
    const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    // Phase 15: Recurring Options
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
    const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
    
    // Phase 15.1: Override Mode
    const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
    const [updateTemplate, setUpdateTemplate] = useState(false);
    const [monthOfYear, setMonthOfYear] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        // Phase 15: Listen for prefill event from reminders
        const handlePrefill = (e: any) => {
            const data = e.detail;
            if (!data) return;

            const accountSelect = document.querySelector('select[name="account_id"]') as HTMLSelectElement;
            if (accountSelect) accountSelect.value = data.account_id;

            setCategoryId(data.category_id);
            if (amountInputRef.current) {
                amountInputRef.current.value = data.amount_original.toString();
                amountInputRef.current.focus();
            }
            const descInput = document.getElementById('description') as HTMLInputElement;
            if (descInput) descInput.value = data.name;
            
            // Set override mode
            setEditingRecurringId(data.recurring_id);
            setIsRecurring(false); // Overrides don't create new templates

            // Scroll to form
            document.getElementById('quick-add-form')?.scrollIntoView({ behavior: 'smooth' });
        };

        window.addEventListener('hf:prefill-quick-add', handlePrefill);

        const savedAccount = localStorage.getItem('lastAccountId');
        const accountSelect = document.querySelector('select[name="account_id"]') as HTMLSelectElement;
        if (savedAccount && accountSelect && accounts.find(a => a.id === savedAccount)) {
            accountSelect.value = savedAccount;
        }

        const savedCategory = localStorage.getItem('lastCategoryId');
        if (savedCategory && categories.find(c => c.id === savedCategory)) {
            setCategoryId(savedCategory);
        }

        // Focus amount input instantly on load
        if (amountInputRef.current && !localStorage.getItem('lastAccountId')) {
            amountInputRef.current.focus();
        }

        return () => window.removeEventListener('hf:prefill-quick-add', handlePrefill);
    }, [accounts, categories]);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);

        try {
            await createTransaction(formData);
            toast.success('Transaction added');

            // Save preferences
            localStorage.setItem('lastAccountId', formData.get('account_id') as string);
            localStorage.setItem('lastCategoryId', formData.get('category_id') as string);

            // Reset amount to completely blank, refocus amount to keep keyboard open
            if (amountInputRef.current) {
                amountInputRef.current.value = '';
                // Micro delay helps some mobile browsers recognize programmatic refocus immediately
                setTimeout(() => {
                    amountInputRef.current?.focus();
                }, 10);
            }
            const descInput = document.getElementById('description') as HTMLInputElement;
            if (descInput) descInput.value = '';

            // Reset override mode
            setEditingRecurringId(null);
            setIsRecurring(false);

        } catch (e: any) {
            toast.error(e.message || 'Failed to add transaction');
        } finally {
            setIsPending(false);
        }
    }

    async function handleConfirmOverride(id: string, amount: number) {
        setIsPending(true);
        try {
            const { confirmRecurringExpense } = await import('@/app/(protected)/dashboard/actions');
            await confirmRecurringExpense(id, amount, updateTemplate);
            toast.success('Reminder confirmed');
            
            // Clean up
            setEditingRecurringId(null);
            setUpdateTemplate(false);
            if (amountInputRef.current) amountInputRef.current.value = '';
            const descInput = document.getElementById('description') as HTMLInputElement;
            if (descInput) descInput.value = '';
        } catch (e: any) {
            toast.error(e.message || 'Failed to confirm reminder');
        } finally {
            setIsPending(false);
        }
    }

    const submitLock = useRef(false);

    const onFormSubmit = async (formData: FormData) => {
        if (submitLock.current) return;
        submitLock.current = true;

        try {
            if (editingRecurringId) {
                await handleConfirmOverride(editingRecurringId, Number(formData.get('amount')));
            } else {
                await handleSubmit(formData);
            }
        } finally {
            submitLock.current = false;
        }
    };

    // Handle enter explicitly on input to satisfy 3-5 sec goal
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (amountInputRef.current) {
                amountInputRef.current.value = '';
                amountInputRef.current.focus();
            }
            const descInput = document.getElementById('description') as HTMLInputElement;
            if (descInput) descInput.value = '';
            
            const accountSelect = document.querySelector('select[name="account_id"]') as HTMLSelectElement;
            const savedAccount = localStorage.getItem('lastAccountId');
            if (accountSelect) {
                accountSelect.value = (savedAccount && accounts.find(a => a.id === savedAccount)) ? savedAccount : '';
            }
            
            const savedCategory = localStorage.getItem('lastCategoryId');
            setCategoryId(savedCategory && categories.find(c => c.id === savedCategory) ? savedCategory : (categories[0]?.id || ''));
            
            setCurrentDate(new Date().toISOString().split('T')[0]);
        }
    };

    const selectedCategory = categories.find(c => c.id === categoryId);
    const selectedCategoryName = selectedCategory?.name || 'Select Category';
    const selectedCategoryIcon = selectedCategory?.icon ?? null;

    return (
        <section id="quick-add-form" className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-lg relative overflow-hidden transition-shadow duration-150 hover:shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                    {editingRecurringId ? 'Confirm Reminder' : 'Quick Add'}
                </h2>
                {editingRecurringId && (
                    <button 
                        onClick={() => {
                            setEditingRecurringId(null);
                            if (amountInputRef.current) amountInputRef.current.value = '';
                            const descInput = document.getElementById('description') as HTMLInputElement;
                            if (descInput) descInput.value = '';
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                        <X size={12} />
                        Cancel
                    </button>
                )}
            </div>

            <form action={onFormSubmit} onKeyDown={handleFormKeyDown} className="max-w-[400px]">
                <div className="flex flex-col gap-3">
                    {/* Amount FIRST with autoFocus and native numpad hook */}
                    <input
                        ref={amountInputRef}
                        name="amount"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        required
                        placeholder="0.00"
                        className="h-16 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-4xl font-black text-gray-900 disabled:opacity-50 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all tabular-nums text-center"
                        disabled={isPending}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Hidden input for category since we use a custom picker */}
                    <input type="hidden" name="category_id" value={categoryId} />

                    <button
                        type="button"
                        onClick={() => setIsCategorySheetOpen(true)}
                        className="h-14 flex items-center justify-between text-left bg-gray-50 border border-gray-200 rounded-2xl px-4 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 active:bg-gray-100 disabled:opacity-50 transition-all font-bold active:scale-[0.99] duration-100"
                        disabled={isPending}
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-gray-400">{getCategoryIcon(selectedCategoryIcon, 16)}</span>
                            {selectedCategoryName}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <select
                            name="type"
                            required
                            defaultValue="expense"
                            className="h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50 transition-all font-bold cursor-pointer appearance-none"
                            disabled={isPending}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>

                        <select
                            name="account_id"
                            defaultValue=""
                            required
                            className="h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50 transition-all font-bold cursor-pointer appearance-none"
                            disabled={isPending}
                        >
                            <option value="" disabled>Select account</option>
                            {accounts?.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({getCurrencySymbol(account.currency_code)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <input
                        id="description"
                        name="description"
                        type="text"
                        placeholder="Description (optional)"
                        className="h-14 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50 transition-all font-medium"
                        disabled={isPending}
                        onKeyDown={handleKeyDown}
                    />
                    
                    <input
                        name="transaction_date"
                        type="hidden"
                        value={currentDate}
                    />

                    {/* Phase 15: Recurring Expense UI - Hidden in override mode */}
                    {!editingRecurringId && (
                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_recurring"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-lg transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600"></div>
                                    <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span className="text-gray-600 text-sm font-bold group-hover:text-gray-900 transition-colors">Recurring Expense</span>
                            </label>

                            {isRecurring && (
                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 ml-1 tracking-widest">Frequency</label>
                                        <select
                                            name="frequency"
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value as any)}
                                            className="w-full h-10 bg-white border border-gray-200 rounded-xl px-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 font-bold"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 ml-1 tracking-widest">Day</label>
                                        <input
                                            type="number"
                                            name="day_of_month"
                                            min="1"
                                            max="31"
                                            value={dayOfMonth}
                                            onChange={(e) => setDayOfMonth(Number(e.target.value))}
                                            className="w-full h-10 bg-white border border-gray-200 rounded-xl px-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 font-bold tabular-nums"
                                        />
                                    </div>
                                    {frequency === 'yearly' && (
                                        <div className="col-span-2">
                                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1 ml-1 tracking-widest">Month</label>
                                            <select
                                                name="month_of_year"
                                                value={monthOfYear}
                                                onChange={(e) => setMonthOfYear(Number(e.target.value))}
                                                className="w-full h-10 bg-white border border-gray-200 rounded-xl px-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 font-bold"
                                            >
                                                <option value="1">January</option>
                                                <option value="2">February</option>
                                                <option value="3">March</option>
                                                <option value="4">April</option>
                                                <option value="5">May</option>
                                                <option value="6">June</option>
                                                <option value="7">July</option>
                                                <option value="8">August</option>
                                                <option value="9">September</option>
                                                <option value="10">October</option>
                                                <option value="11">November</option>
                                                <option value="12">December</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full h-16 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 uppercase tracking-widest mt-2 duration-100" 
                        disabled={isPending}
                    >
                        {isPending ? (
                            editingRecurringId ? 'Confirming...' : 'Adding...'
                        ) : (
                            <>
                                {editingRecurringId ? (
                                    <>
                                        <Check size={18} />
                                        <span>Confirm Reminder</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        <span>Add Transaction</span>
                                    </>
                                )}
                            </>
                        )}
                    </button>
                    {/* Phase 15.2: Template Update Option (Only in override mode) */}
                    {editingRecurringId && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="flex items-center gap-2 cursor-pointer group p-3 bg-gray-50 border border-gray-100 rounded-2xl hover:border-indigo-300 transition-all active:scale-[0.99] duration-100">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={updateTemplate}
                                        onChange={(e) => setUpdateTemplate(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600"></div>
                                    <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span className="text-gray-400 text-[11px] font-bold group-hover:text-gray-600 transition-colors">Update future payments</span>
                            </label>
                        </div>
                    )}
                </div>
            </form>

            <BottomSheet 
              isOpen={isCategorySheetOpen} 
              onClose={() => setIsCategorySheetOpen(false)}
              title="Select Category"
            >
                <div className="grid grid-cols-1 gap-2 pb-6">
                    {categories?.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                                setCategoryId(cat.id);
                                setIsCategorySheetOpen(false);
                            }}
                            className={`p-4 text-left rounded-xl transition-all flex items-center justify-between font-bold ${categoryId === cat.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <span className="flex items-center gap-3">
                                <span className={categoryId === cat.id ? 'text-indigo-500' : 'text-gray-400'}>
                                    {getCategoryIcon(cat.icon ?? null, 16)}
                                </span>
                                {cat.name}
                            </span>
                            {categoryId === cat.id && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M20 6 9 17l-5-5"/></svg>
                            )}
                        </button>
                    ))}
                </div>
            </BottomSheet>
        </section>
    );
}
