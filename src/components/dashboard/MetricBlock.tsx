import React from 'react';

interface MetricBlockProps {
    label: string;
    value: number | string;
    valueColorClass: string;
    delta?: number;
    invertedDelta?: boolean;
}

export default function MetricBlock({ label, value, valueColorClass, delta, invertedDelta = false }: MetricBlockProps) {
    const getDeltaColor = (d: number) => {
        if (d === 0) return 'text-gray-400';
        if (invertedDelta) return d > 0 ? 'text-rose-600' : 'text-emerald-600';
        return d > 0 ? 'text-emerald-600' : 'text-rose-600';
    };

    const formatDelta = (d: number) => {
        if (d === 0) return '0%';
        return `${d > 0 ? '+' : ''}${d}%`;
    };

    return (
        <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-2xl font-semibold ${valueColorClass}`}>
                    {value}
                </p>
                {delta !== undefined && (
                    <span className={`text-sm ${getDeltaColor(delta)}`}>
                        {formatDelta(delta)}
                    </span>
                )}
            </div>
        </div>
    );
}
