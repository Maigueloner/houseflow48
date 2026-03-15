'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryData {
    category_id: string;
    category_name: string;
    total_amount: number;
    percentage_of_total: number;
}

interface CategoryChartProps {
    categories: CategoryData[];
}

export default function CategoryChart({ categories }: CategoryChartProps) {
    if (!categories || categories.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest px-2">Spending by Category</h2>
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                        <PieChartIcon size={24} />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">
                        No category data for this month. <br />
                        <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mt-1 block">Categories with expenses will be visualized here</span>
                    </p>
                </div>
            </div>
        );
    }

    // Default Tailwind colors for standard visualization: emerald, rose, blue, amber, violet
    const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

    // Assuming 'breakdown' is derived from 'categories' or passed as a prop
    // For the purpose of this edit, we'll create a dummy 'breakdown' that matches the new structure
    // In a real application, 'breakdown' would be properly defined based on 'categories'
    const breakdown = categories.map((cat, index) => ({
        name: cat.category_name,
        spent: cat.total_amount,
        color: COLORS[index % COLORS.length],
    }));


    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition-shadow duration-150 hover:shadow-md">
            <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest px-2">Spending by Category</h2>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={breakdown}
                            dataKey="spent"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            isAnimationActive={true}
                            animationDuration={600}
                            animationEasing="ease-out"
                        >
                            {breakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}
                            formatter={(value: any) => [`€${Number(value).toLocaleString()}`, '']}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight tabular-nums">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
