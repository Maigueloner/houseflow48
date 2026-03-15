'use client';

import { useState } from 'react';
import { confirmRecurringExpense, skipRecurringExpense } from '@/app/(protected)/dashboard/actions';
import { Bell, Check, Edit2, X } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currency';

interface DueExpense {
    recurring_id: string;
    name: string;
    amount_original: number;
    currency_code: string;
    category_id: string;
    category_name: string;
    account_id: string;
    account_name: string;
    frequency: string;
    day_of_month: number;
    last_confirmed_date: string | null;
}

interface RecurringExpenseReminderCardProps {
    dueExpenses: DueExpense[];
}

export default function RecurringExpenseReminderCard({ dueExpenses }: RecurringExpenseReminderCardProps) {
    const [pendingIds, setPendingIds] = useState<string[]>([]);

    if (dueExpenses.length === 0) return null;

    const handleEdit = (expense: DueExpense) => {
        const event = new CustomEvent('hf:prefill-quick-add', { detail: expense });
        window.dispatchEvent(event);
    };

    const handleConfirm = async (id: string) => {
        setPendingIds(prev => [...prev, id]);
        try {
            await confirmRecurringExpense(id);
        } catch (error) {
            console.error('Failed to confirm recurring expense:', error);
            setPendingIds(prev => prev.filter(pId => pId !== id));
        }
    };

    const handleSkip = async (id: string) => {
        setPendingIds(prev => [...prev, id]);
        try {
            await skipRecurringExpense(id);
        } catch (error) {
            console.error('Failed to skip recurring expense:', error);
            setPendingIds(prev => prev.filter(pId => pId !== id));
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Bell size={12} className="text-amber-500" />
                Reminders ({dueExpenses.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dueExpenses.map((expense) => {
                    const isProcessing = pendingIds.includes(expense.recurring_id);
                    
                    return (
                        <div 
                            key={expense.recurring_id} 
                            className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden group"
                        >
                            {isProcessing && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">{expense.category_name}</p>
                                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{expense.name}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        {expense.account_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-gray-900 tabular-nums leading-none">
                                        {getCurrencySymbol(expense.currency_code)}{expense.amount_original.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{expense.currency_code}</p>
                                    <div className="flex flex-col items-end gap-1 mt-2">
                                        {(() => {
                                            const today = new Date().getDate();
                                            const isToday = expense.day_of_month === today;
                                            const isOverdue = expense.day_of_month < today;
                                            
                                            if (isToday) return <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 uppercase tracking-tight">Due today</span>;
                                            if (isOverdue) return <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 uppercase tracking-tight">Overdue</span>;
                                            return <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Day {expense.day_of_month}</span>;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleConfirm(expense.recurring_id)}
                                    disabled={isProcessing}
                                    className="flex-1 h-10 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl transition-all text-xs font-bold active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Check size={14} />
                                    Confirm
                                </button>
                                
                                <button
                                    onClick={() => handleEdit(expense)}
                                    disabled={isProcessing}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                                    title="Edit & Add"
                                >
                                    <Edit2 size={14} />
                                </button>

                                <button
                                    onClick={() => handleSkip(expense.recurring_id)}
                                    disabled={isProcessing}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                                    title="Skip for now"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
