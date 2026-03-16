'use client';

import React, { useState } from 'react';
import TransactionRow from './TransactionRow';

interface TransactionListClientProps {
    transactions: any[];
    accounts: any[];
    categories: any[];
}

export default function TransactionListClient({ transactions, accounts, categories }: TransactionListClientProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const showToggle = transactions.length > 5;
    const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 5);

    return (
        <>
            <ul className="divide-y divide-gray-100">
                {displayedTransactions.map((t) => (
                    <TransactionRow
                        key={t.id}
                        transaction={t}
                        accounts={accounts}
                        categories={categories}
                    />
                ))}
            </ul>
            
            {showToggle && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest py-3 w-full text-center border-t border-gray-50 mt-1"
                >
                    {isExpanded ? 'Show less' : `Show all ${transactions.length} transactions`}
                </button>
            )}
        </>
    );
}
