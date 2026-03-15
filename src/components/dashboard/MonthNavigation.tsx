'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface MonthNavigationProps {
    currentMonth: string; // YYYY-MM
}

export default function MonthNavigation({ currentMonth }: MonthNavigationProps) {
    const searchParams = useSearchParams();

    const [year, month] = currentMonth.split('-').map(Number);

    // Prev month
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    const prevMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;

    // Next month
    const nextDate = new Date(Date.UTC(year, month, 1));
    const nextMonthStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, '0')}`;

    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        return params.toString();
    };

    // Format display: e.g. "March 2026"
    const displayLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });

    return (
        <div className="flex items-center justify-center gap-4 mb-4">
            <Link
                href={`?${createQueryString('month', prevMonthStr)}`}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous Month"
            >
                ←
            </Link>

            <span className="text-lg font-semibold min-w-[150px] text-center text-gray-900">
                {displayLabel}
            </span>

            <Link
                href={`?${createQueryString('month', nextMonthStr)}`}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next Month"
            >
                →
            </Link>
        </div>
    );
}
