'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { setCategoryBudget } from '@/app/(protected)/dashboard/actions';
import { BudgetCategory } from './BudgetCategoryList';

interface Props {
    category: BudgetCategory;
    monthDateDay1: string;
}

export default function BudgetCategoryItem({ category, monthDateDay1 }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(category.budget_eur?.toString() || '');
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state if prop changes (e.g., after a successful save)
    useEffect(() => {
        setEditValue(category.budget_eur?.toString() || '');
    }, [category.budget_eur]);

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('category_id', category.category_id);
            formData.append('month', monthDateDay1);
            formData.append('budget_eur', editValue);

            try {
                await setCategoryBudget(formData);
                setIsEditing(false);
            } catch (error) {
                console.error('Failed to set budget:', error);
                alert('Failed to save budget. Please try again.');
            }
        });
    };

    const handleCancel = () => {
        setEditValue(category.budget_eur?.toString() || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    // Progress Bar Logic
    const hasBudget = category.budget_eur !== null && category.budget_eur !== undefined;
    const budgetVal = Number(category.budget_eur || 0);
    const spentVal = Number(category.spent_eur || 0);
    const percentUsed = budgetVal > 0 ? (spentVal / budgetVal) * 100 : 0;
    const barWidth = Math.min(percentUsed, 100);
    const isOverLimit = spentVal > budgetVal;

    return (
        <div className="flex flex-col gap-1 py-3 border-t border-gray-100 first:border-t-0">
            <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">{category.category_name}</span>
                
                <div className="flex items-center gap-2 h-8">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input
                                ref={inputRef}
                                autoFocus
                                type="number"
                                min="0"
                                step="1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isPending}
                                className="w-20 h-8 px-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all tabular-nums"
                            />
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                                title="Save"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                                title="Cancel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="flex items-center gap-2 cursor-pointer group/value h-full"
                            onClick={() => setIsEditing(true)}
                        >
                            {!hasBudget ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-medium">
                                        €{spentVal.toFixed(0)} spent
                                    </span>
                                    <span className="text-indigo-600 font-bold text-xs uppercase tracking-tight group-hover/value:underline">
                                        [Set budget]
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-400 font-medium whitespace-nowrap">
                                    <span className="text-gray-900 font-bold tabular-nums">€{spentVal.toFixed(0)}</span>
                                    <span className="mx-1">/</span>
                                    <span className="group-hover/value:text-indigo-600 group-hover/value:underline transition-colors tabular-nums">€{budgetVal.toFixed(0)}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {hasBudget && !isEditing && (
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-1 shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${isOverLimit ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${barWidth}%` }}
                    />
                </div>
            )}
        </div>
    );
}
