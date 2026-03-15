'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HelpCircle, MoreHorizontal } from 'lucide-react';
import { getCategoryIcon } from '@/utils/categoryIcon';

interface CategoryBreakdown {
    category_id: string | null;
    name: string;
    spent: number;
    percent: number;
    transaction_count: number;
    color: string;
    icon: string;
}

interface CategorySpendingChartProps {
    breakdown: CategoryBreakdown[];
    totalExpenses: number;
}

export default function CategorySpendingChart({ breakdown, totalExpenses }: CategorySpendingChartProps) {
    if (!breakdown || breakdown.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 h-[200px] flex items-center justify-center shadow-sm font-medium">
                No categorical data available for this month.
            </div>
        );
    }

    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 overflow-hidden transition-shadow duration-150 hover:shadow-md">
            <h2 className="text-sm font-bold text-gray-900 mb-4 px-1 uppercase tracking-widest">Spending Distribution</h2>
            
            <div className="flex flex-col gap-4">
                {/* 1. Donut Chart */}
                <div className="h-[160px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={breakdown}
                                dataKey="spent"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={2}
                                stroke="none"
                                isAnimationActive={true}
                                animationDuration={600}
                                animationEasing="ease-out"
                            >
                                {breakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: any, name: any) => [`€${Number(value).toLocaleString()}`, name as string]}
                                contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-gray-900 tabular-nums">€{Number(totalExpenses).toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    </div>
                </div>

                {/* 2. Custom Legend */}
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {breakdown.map((item, index) => (
                        <div key={item.category_id || item.name} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm"
                                    style={{ color: item.color }}
                                >
                                    {item.name === 'Other' ? (
                                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        getCategoryIcon(item.icon, 18)
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900 leading-tight">{item.name}</p>
                                    <p className="text-[9px] font-medium text-gray-400">{item.transaction_count} txs</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-gray-900 tabular-nums leading-tight">€{Number(item.spent).toLocaleString()}</p>
                                <p className="text-[9px] font-black text-gray-400 tabular-nums">{item.percent}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
