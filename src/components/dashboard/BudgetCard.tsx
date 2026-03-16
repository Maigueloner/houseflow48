'use client';

import React, { useState, useTransition } from 'react';
import BudgetCategoryList, { BudgetCategory } from './BudgetCategoryList';
import { copyPreviousMonthBudgets } from '@/app/(protected)/dashboard/actions';

export interface BudgetTotals {
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    total_percent: number;
}

interface BudgetCardProps {
    monthString: string; 
    monthDateDay1: string; 
    totals: BudgetTotals | null;
    categories: BudgetCategory[];
}

export default function BudgetCard({ monthString, monthDateDay1, totals, categories }: BudgetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPending, startTransition] = useTransition();

    const hasBudgets = categories.length > 0;

    const handleCopyPrevious = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('target_month', monthDateDay1);
            await copyPreviousMonthBudgets(formData);
        });
    };

    if (!hasBudgets) {
        return (
            <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[140px] text-center gap-6">
                <h2 className="text-gray-400 font-bold uppercase tracking-widest text-xs">No budgets defined</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleCopyPrevious}
                        disabled={isPending}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-[0.97] duration-100"
                    >
                        {isPending ? 'Copying...' : 'Copy Previous Month'}
                    </button>
                    <button 
                        onClick={() => alert("Manual budget creation modal to be implemented")}
                        disabled={isPending}
                        className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-xs transition-all disabled:opacity-50 w-full sm:w-auto flex items-center justify-center active:scale-[0.97] duration-100"
                    >
                        Create Manually
                    </button>
                </div>
            </section>
        );
    }

    // Fallback safely if limits hit empty returns natively 
    const safeTotals: BudgetTotals = totals || { total_budget: 0, total_spent: 0, total_percent: 0, total_remaining: 0 };

    let totalProgressColor = 'bg-indigo-500';
    if (safeTotals.total_percent >= 100) {
        totalProgressColor = 'bg-rose-500';
    } else if (safeTotals.total_percent >= 80) {
        totalProgressColor = 'bg-amber-500';
    }

    const totalBarWidth = Math.min(safeTotals.total_percent, 100);

    return (
        <section 
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md group"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header / Collapsed State Summary */}
            <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Monthly Budget</h2>
                    <div className="text-gray-400 flex items-center gap-2 text-sm">
                        <span className="tabular-nums">
                            <span className="text-gray-900 font-bold">€{Number(safeTotals.total_spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> / €{Number(safeTotals.total_budget).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${totalProgressColor}`}
                        style={{ width: `${totalBarWidth}%` }}
                    />
                </div>
            </div>

            {/* Expanded State Category details */}
            <div 
                className={`grid transition-all duration-300 ease-in-out px-4 overflow-hidden bg-gray-50/50 ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-4 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0'}`}
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="overflow-hidden">
                    <div className="mt-4">
                        <BudgetCategoryList 
                            categories={categories} 
                            monthDateDay1={monthDateDay1} 
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
