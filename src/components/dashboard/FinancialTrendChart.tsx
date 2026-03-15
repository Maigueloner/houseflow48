'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendData {
    month: string;
    total_income: number;
    total_expense: number;
    net: number;
}

interface FinancialTrendChartProps {
    data: TrendData[];
}

export default function FinancialTrendChart({ data }: FinancialTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest px-2">Financial Trends</h2>
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                        <TrendingUp size={24} />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">
                        No trend data available yet. <br />
                        <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mt-1 block">Data will appear once you have transactions over multiple months</span>
                    </p>
                </div>
            </div>
        );
    }

    // Format the date for the X-axis (e.g., '2026-03-01' -> 'Mar 2026')
    const formattedData = data.map(item => {
        const date = new Date(item.month);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
            ...item,
            month: monthYear,
            income: item.total_income,
            expenses: item.total_expense
        };
    });

    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition-shadow duration-150 hover:shadow-md">
            <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest px-2">Financial Trends</h2>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="month" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fill: '#64748b', fontWeight: 600 }}
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tick={{ fill: '#64748b', fontWeight: 600 }}
                            tickFormatter={(value) => `€${value}`}
                            width={60}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}
                            itemStyle={{ padding: '2px 0' }}
                            formatter={(value: any) => [`€${Number(value).toLocaleString()}`, '']}
                        />
                        <Legend 
                            verticalAlign="top" 
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Bar 
                            name="Income"
                            dataKey="income" 
                            fill="#16a34a" 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={40}
                            isAnimationActive={true}
                            animationDuration={600}
                            animationEasing="ease-out"
                        />
                        <Bar 
                            name="Expenses"
                            dataKey="expenses" 
                            fill="#ef4444" 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={40}
                            isAnimationActive={true}
                            animationDuration={600}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
