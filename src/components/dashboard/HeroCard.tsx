import React from 'react';
import { BarChart3 } from 'lucide-react';

interface HeroCardProps {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
}

export default function HeroCard({
    income,
    expenses,
    net,
    savingsRate,
}: HeroCardProps) {
    const isNetPositive = net >= 0;

    let savingsColor = 'text-red-500';
    if (savingsRate > 20) {
        savingsColor = 'text-green-600';
    } else if (savingsRate >= 10) {
        savingsColor = 'text-amber-500';
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[150px] transition-shadow duration-150 hover:shadow-md group">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Financial Overview</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Income</span>
                    <span className="text-lg font-bold text-green-600 tabular-nums">
                        €{income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Expenses</span>
                    <span className="text-lg font-bold text-red-500 tabular-nums">
                        €{expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center py-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Net Result</span>
                <span className={`text-3xl font-black tabular-nums ${isNetPositive ? 'text-green-600' : 'text-red-500'}`}>
                    €{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>

            <div className="flex justify-center">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Savings Rate:</span>
                    <span className={`text-xs font-bold tabular-nums ${savingsColor}`}>
                        {savingsRate.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
