'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { exportTransactionsCsv } from '@/utils/exportCsv';

export interface Transaction {
    id: string;
    transaction_date: string;    // YYYY-MM-DD
    description: string | null;
    amount: number;
    currency: string | null;     // ISO code, e.g. 'EUR', 'THB'
    type: 'income' | 'expense';
    category_id: string | null;
    category: string | null;     // text fallback stored on the record
    account_id: string;
}

export interface Account {
    id: string;
    name: string;
}

export interface Category {
    id: string;
    name: string;
}

interface ExportTransactionsButtonProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    month: string; // YYYY-MM
}

export default function ExportTransactionsButton({
    transactions,
    accounts,
    categories,
    month
}: ExportTransactionsButtonProps) {
    const handleExport = () => {
        exportTransactionsCsv(transactions, accounts, categories, month);
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            title="Export month"
            aria-label="Export month"
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded"
        >
            <Download size={15} />
        </button>
    );
}
