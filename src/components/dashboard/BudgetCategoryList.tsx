import React from 'react';

export interface BudgetCategory {
    category_id: string;
    category_name: string;
    budget_eur: number;
    spent_eur: number;
    remaining_eur: number;
    percent_used: number;
}

interface Props {
    category: BudgetCategory;
}

export default function BudgetCategoryList({ category }: Props) {
    let progressColor = 'bg-indigo-500';
    if (category.percent_used >= 100) {
        progressColor = 'bg-rose-500';
    } else if (category.percent_used >= 80) {
        progressColor = 'bg-amber-500';
    }

    // Cap progress bar at 100%
    const barWidth = Math.min(category.percent_used, 100);

    return (
        <div className="flex flex-col gap-1 py-3 border-t border-gray-100">
            <div className="flex justify-between items-end text-sm">
                <span className="font-bold text-gray-700">{category.category_name}</span>
                <span className="text-gray-400 font-medium">
                    <span className="text-gray-900 font-bold">€{Number(category.spent_eur).toFixed(0)}</span> / €{Number(category.budget_eur).toFixed(0)}
                </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </div>
    );
}
