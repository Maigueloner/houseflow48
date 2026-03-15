import React from 'react';
import { TrendingUp, TrendingDown, Minus, Wallet, Receipt, Calculator, Target } from 'lucide-react';

interface MonthlyReportCardProps {
    report: {
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
        trend: {
            previous_net: number;
            direction: 'improving' | 'declining' | 'stable';
        };
    };
}

export default function MonthlyReportCard({ report }: MonthlyReportCardProps) {
    const getTrendIcon = () => {
        switch (report.trend.direction) {
            case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTrendLabel = () => {
        switch (report.trend.direction) {
            case 'improving': return 'Improving vs last month';
            case 'declining': return 'Declining vs last month';
            default: return 'Stable vs last month';
        }
    };

    return (
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-shadow duration-150 hover:shadow-md">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                        <Calculator className="w-4 h-4 text-indigo-500" />
                        Monthly Report
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-600 uppercase">
                        {getTrendIcon()}
                        {getTrendLabel()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* 1. Cash Flow Summary */}
                <div className="p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cash Flow</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Income
                            </span>
                            <span className="text-green-600 font-bold tabular-nums">€{Number(report.income).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs flex items-center gap-2">
                                <Receipt className="w-3 h-3" /> Expenses
                            </span>
                            <span className="text-red-500 font-bold tabular-nums">€{Number(report.expenses).toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-50 flex justify-between items-baseline">
                            <span className="text-gray-900 text-xs font-bold">Net Result</span>
                            <span className={`text-xl font-black tabular-nums ${report.net_result >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                €{Number(report.net_result).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Budget Performance */}
                <div className="p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs">Total Budget</span>
                            <span className="text-gray-900 font-bold tabular-nums text-sm">€{Number(report.budget.total).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs">Remaining</span>
                            <span className="text-gray-900 font-bold tabular-nums text-sm">€{Number(report.budget.remaining).toLocaleString()}</span>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                                <span className="text-gray-400">Utilization</span>
                                <span className="text-gray-600 tabular-nums">
                                    {report.budget.total > 0 ? Math.round((report.budget.spent / report.budget.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${report.budget.spent > report.budget.total ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min(report.budget.total > 0 ? (report.budget.spent / report.budget.total) * 100 : 0, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Savings Contribution */}
                <div className="p-4 space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Savings Goal</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs flex items-center gap-2">
                                <Target className="w-3 h-3" /> This Month
                            </span>
                            <span className="text-green-600 font-bold tabular-nums text-sm">€{Number(report.savings.contribution).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-gray-500 text-xs">Target</span>
                            <span className="text-gray-900 font-bold tabular-nums text-sm">€{Number(report.savings.goal_target).toLocaleString()}</span>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                                <span className="text-gray-400">Goal Progress</span>
                                <span className="text-gray-600 tabular-nums">{report.savings.goal_progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-600 transition-all duration-500"
                                    style={{ width: `${Math.min(report.savings.goal_progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
