'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HelpCircle, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getCategoryIcon } from '@/utils/categoryIcon';
import { getCategoryTransactions } from '@/app/(protected)/dashboard/actions';
import TransactionRow from '@/components/dashboard/TransactionRow';

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
    accounts: any[];
    categories: any[];
    start_date: string;
    end_date: string;
}

export default function CategorySpendingChart({ 
    breakdown, 
    totalExpenses,
    accounts,
    categories,
    start_date,
    end_date
}: CategorySpendingChartProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Record<string, any[]>>({});
    const [loadingCategoryId, setLoadingCategoryId] = useState<string | null>(null);
    const [errorCategoryId, setErrorCategoryId] = useState<string | null>(null);
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

    const fetchTransactions = async (id: string) => {
        if (!id) return;
        
        setLoadingCategoryId(id);
        setErrorCategoryId(null);
        
        try {
            const data = await getCategoryTransactions(id, start_date, end_date);
            setTransactions(prev => ({ ...prev, [id]: data || [] }));
        } catch (e) {
            console.error('Failed to fetch transactions for category:', id, e);
            setErrorCategoryId(id);
        } finally {
            // Guard against race conditions (🔴 3. Loading Race Condition)
            setLoadingCategoryId(prev => (prev === id ? null : prev));
        }
    };

    const handleCategoryClick = async (id: string | null) => {
        if (!id) return;

        if (selectedCategoryId === id) {
            setSelectedCategoryId(null);
            return;
        }

        setSelectedCategoryId(id);

        if (!transactions[id]) {
            fetchTransactions(id);
        }
    };

    // 🔴 1. Reset state on data change (Cache Invalidation)
    useEffect(() => {
        setTransactions({});
        setSelectedCategoryId(null);
    }, [breakdown]);

    // 🔴 5. URL Sync Safety: Safe initialization
    useEffect(() => {
        const param = searchParams.get('category');
        if (param) {
            // Validate that the category exists in current breakdown
            const exists = breakdown.find(b => b.category_id === param);
            if (exists) {
                setSelectedCategoryId(param);
                fetchTransactions(param);
            }
        }
    }, []); // Only on mount

    // 🔴 2. Unified URL Synchronization (Fix Leakage & Source of Truth)
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (selectedCategoryId) {
            params.set('category', selectedCategoryId);
        } else {
            params.delete('category');
        }

        const queryString = params.toString();
        const nextUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;
        
        router.replace(nextUrl, { scroll: false });
    }, [selectedCategoryId, pathname, router, searchParams]);

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
                                onClick={(data: any) => {
                                    const categoryId = data?.payload?.category_id;
                                    if (categoryId) {
                                        handleCategoryClick(categoryId);
                                    }
                                }}
                                onMouseEnter={(data: any) => {
                                    if (data?.payload?.category_id) {
                                        setHoveredCategoryId(data.payload.category_id);
                                    }
                                }}
                                onMouseLeave={() => setHoveredCategoryId(null)}
                            >
                                {breakdown.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color || '#9ca3af'} 
                                        style={{ 
                                            cursor: entry.category_id ? 'pointer' : 'default',
                                            transition: 'opacity 0.2s ease',
                                            opacity: hoveredCategoryId && hoveredCategoryId !== entry.category_id ? 0.6 : 1
                                        }}
                                    />
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
                        <span className="text-xl font-black text-gray-900 tabular-nums">€{new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.trunc(totalExpenses * 100) / 100)}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    </div>
                </div>

                {/* 2. Custom Legend */}
                <div className="space-y-1.5 pr-1">
                    {breakdown.map((item, index) => (
                        <div key={item.category_id || item.name}>
                            <div 
                                onClick={() => handleCategoryClick(item.category_id)}
                                onMouseEnter={() => setHoveredCategoryId(item.category_id)}
                                onMouseLeave={() => setHoveredCategoryId(null)}
                                className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 group cursor-pointer ${selectedCategoryId === item.category_id ? 'bg-indigo-50 border border-indigo-100 ring-1 ring-indigo-200/50' : hoveredCategoryId === item.category_id ? 'bg-gray-100 border border-gray-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color || '#9ca3af' }}
                                    />
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

                            {/* Expansion (inline) */}
                            {selectedCategoryId === item.category_id && (
                                <div className="mt-3 mb-4 space-y-2 px-1">
                                    {/* Expanded Header */}
                                    <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{item.name} Activity</span>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-900 tabular-nums">€{Number(item.spent).toLocaleString()}</span>
                                    </div>

                                    {loadingCategoryId === item.category_id && (
                                        <div className="space-y-2 py-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-[56px] w-full bg-gray-50 animate-pulse rounded-xl border border-gray-100 shadow-sm" />
                                            ))}
                                        </div>
                                    )}

                                    {!loadingCategoryId && transactions[item.category_id]?.length === 0 && !errorCategoryId && (
                                        <div className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            No transactions in this category for this month.
                                        </div>
                                    )}

                                    {!loadingCategoryId && transactions[item.category_id]?.map(tx => (
                                        <div key={tx.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors">
                                            <TransactionRow
                                                transaction={tx}
                                                accounts={accounts}
                                                categories={categories}
                                            />
                                        </div>
                                    ))}
                                    
                                    {errorCategoryId === item.category_id && !loadingCategoryId && (
                                        <div className="py-6 text-center bg-rose-50 rounded-xl border border-rose-100">
                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Failed to load transactions</p>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fetchTransactions(item.category_id!);
                                                }}
                                                className="text-[9px] font-black bg-rose-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter hover:bg-rose-600 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
