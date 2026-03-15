import React from 'react';
import MetricBlock from './MetricBlock';

interface FinancialOverviewCardProps {
    income_current: number;
    income_delta_percent: number;
    expense_current: number;
    expense_delta_percent: number;
}

export default function FinancialOverviewCard({ 
    income_current, 
    income_delta_percent, 
    expense_current, 
    expense_delta_percent 
}: FinancialOverviewCardProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 divide-x divide-zinc-800">
                <div className="px-4">
                    <MetricBlock
                        label="Income"
                        value={`€${Number(income_current).toFixed(2)}`}
                        valueColorClass="text-emerald-500"
                        delta={income_delta_percent}
                    />
                </div>
                <div className="px-4">
                    <MetricBlock
                        label="Expenses"
                        value={`€${Number(expense_current).toFixed(2)}`}
                        valueColorClass="text-rose-500"
                        delta={expense_delta_percent}
                        invertedDelta={true}
                    />
                </div>
            </div>
        </div>
    );
}
