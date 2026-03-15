import TransactionRow from './TransactionRow';
import { List, Search } from 'lucide-react';

interface TransactionListProps {
    title?: string;
    transactions: any[];
    accounts: any[];
    categories: any[];
}

export default function TransactionList({ title, transactions, accounts, categories }: TransactionListProps) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                {title && <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest">{title}</h2>}
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                        <Search size={24} />
                    </div>
                    <p className="text-gray-400 font-medium text-sm max-w-[240px] mx-auto">
                        No transactions recorded for this month. <br />
                        <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold mt-2 block">Add your first transaction to start tracking</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            {title && (
                <div className="flex items-center gap-2 mb-4">
                    <List size={16} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                </div>
            )}
            <ul className="divide-y divide-gray-100">
                {transactions.map((t) => (
                    <TransactionRow
                        key={t.id}
                        transaction={t}
                        accounts={accounts}
                        categories={categories}
                    />
                ))}
            </ul>
        </div>
    );
}
