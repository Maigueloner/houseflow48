'use client';

import { useState } from 'react';
import { setExchangeRate } from '@/app/(protected)/dashboard/actions';

interface ExchangeRateAlertProps {
    monthString: string; // e.g. "April 2026"
    monthDate: string; // e.g. "2026-04-01"
    currentRate: number | null;
    lastMonthRate: number | null;
}

export default function ExchangeRateAlert({ monthString, monthDate, currentRate, lastMonthRate }: ExchangeRateAlertProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMissing = currentRate === null;
    const showForm = isMissing || isEditing;

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        setError(null);
        try {
            await setExchangeRate(formData);
            setIsEditing(false);
        } catch (e: any) {
            setError(e.message || 'Failed to set rate');
        } finally {
            setIsPending(false);
        }
    }

    // Quick add wrapper
    async function handleUseLastMonth() {
        if (!lastMonthRate) return;
        setIsPending(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('rate_to_eur', lastMonthRate.toString());
            formData.append('month', monthDate);
            await setExchangeRate(formData);
            setIsEditing(false);
        } catch (e: any) {
            setError(e.message || 'Failed to set rate');
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className={`mb-8 p-4 rounded-xl border ${isMissing ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-400'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    {isMissing ? (
                        <p className="m-0 font-semibold flex items-center gap-2">
                            <span>⚠</span> THB exchange rate for {monthString} is not set.
                        </p>
                    ) : (
                        <p className="m-0">
                            <strong className="text-gray-900">THB Rate ({monthString}):</strong> 1 EUR = {currentRate} THB
                        </p>
                    )}
                </div>

                {!showForm && (
                    <button onClick={() => setIsEditing(true)} className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-md px-3 py-1.5 font-medium text-sm transition-colors disabled:opacity-50 shadow-sm">
                        Edit Rate
                    </button>
                )}
            </div>

            {showForm && (
                <div className="mt-4">
                    <form action={handleSubmit} className="flex gap-2 items-center flex-wrap">
                        <input type="hidden" name="month" value={monthDate} />
                        <label htmlFor="rate_to_eur" className="text-sm font-medium">1 EUR = </label>
                        <input
                            type="number"
                            id="rate_to_eur"
                            name="rate_to_eur"
                            step="0.0001"
                            defaultValue={currentRate || ''}
                            required
                            placeholder="e.g. 39.10"
                            className="w-[120px] bg-gray-50 border border-gray-200 rounded-md p-2 text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all font-bold tabular-nums"
                            disabled={isPending}
                        />
                        <span className="text-sm font-medium">THB</span>
                        <button type="submit" disabled={isPending} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-50 shadow-sm">
                            {isPending ? 'Saving...' : 'Save Rate'}
                        </button>

                        {isEditing && !isMissing && (
                            <button type="button" onClick={() => setIsEditing(false)} disabled={isPending} className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-md px-3 py-2 font-medium text-sm transition-colors disabled:opacity-50 shadow-sm">
                                Cancel
                            </button>
                        )}
                    </form>

                    {isMissing && lastMonthRate && (
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={handleUseLastMonth}
                                disabled={isPending}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 rounded-md px-3 py-2 font-bold text-xs transition-colors disabled:opacity-50"
                            >
                                Use last month rate: <span className="tabular-nums">{lastMonthRate} THB</span>
                            </button>
                        </div>
                    )}

                    {error && <p className="text-rose-500 mt-2 text-sm">{error}</p>}
                </div>
            )}
        </div>
    );
}
