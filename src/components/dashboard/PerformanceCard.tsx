import React from 'react';
import MetricBlock from './MetricBlock';

interface PerformanceCardProps {
    net_current: number;
    net_delta_percent: number;
    savings_rate_current: number;
}

export default function PerformanceCard({ 
    net_current, 
    net_delta_percent, 
    savings_rate_current 
}: PerformanceCardProps) {
    const netColor = net_current >= 0 ? 'text-emerald-500' : 'text-rose-500';
    
    let savingsColor = 'text-rose-500';
    if (savings_rate_current > 20) {
        savingsColor = 'text-emerald-500';
    } else if (savings_rate_current >= 10) {
        savingsColor = 'text-amber-500';
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 divide-x divide-zinc-800">
                <div className="px-4">
                    <MetricBlock
                        label="Net Result"
                        value={`€${Number(net_current).toFixed(2)}`}
                        valueColorClass={netColor}
                        delta={net_delta_percent}
                    />
                </div>
                <div className="px-4">
                    <MetricBlock
                        label="Savings Rate"
                        value={`${Number(savings_rate_current).toFixed(1)}%`}
                        valueColorClass={savingsColor}
                    />
                </div>
            </div>
        </div>
    );
}
