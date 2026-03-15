'use client';

import { useState, useRef, useEffect } from 'react';
import { updateTransaction, deleteTransaction } from '@/app/(protected)/dashboard/actions';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getCurrencySymbol } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcon';

interface TransactionRowProps {
    transaction: any;
    accounts: any[];
    categories: any[];
}

export default function TransactionRow({ transaction, accounts, categories }: TransactionRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [amount, setAmount] = useState(transaction.amount);
    const [type, setType] = useState(transaction.type);
    const [date, setDate] = useState(transaction.transaction_date);
    const [accountId, setAccountId] = useState(transaction.account_id);
    const [categoryId, setCategoryId] = useState(transaction.category_id);
    const [description, setDescription] = useState(transaction.description || '');

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        const formData = new FormData();
        formData.append('id', transaction.id);
        formData.append('amount', amount.toString());
        formData.append('type', type);
        formData.append('transaction_date', date);
        formData.append('account_id', accountId);
        formData.append('category_id', categoryId);
        formData.append('description', description);

        try {
            await updateTransaction(formData);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update transaction');
        } finally {
            setIsPending(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        setIsPending(true);
        setError(null);

        const formData = new FormData();
        formData.append('id', transaction.id);

        try {
            await deleteTransaction(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to delete transaction');
            setIsPending(false);
        }
    }

    if (isEditing) {
        return (
            <li className="p-6 bg-white border border-gray-200 rounded-2xl shadow-lg my-2 mx-1 relative z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                <form 
                    onSubmit={handleSave} 
                    className="grid gap-4"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsEditing(false);
                    }}
                >
                    {error && <div className="text-rose-500 text-sm">{error}</div>}
                    
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="date"
                            className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-medium"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            disabled={isPending}
                        />
                        <select className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-medium cursor-pointer" value={type} onChange={(e) => setType(e.target.value)} disabled={isPending}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <input
                            type="number"
                            step="0.01"
                            className="w-28 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-bold tabular-nums"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            disabled={isPending}
                        />
                        <select className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-medium cursor-pointer" value={accountId} onChange={(e) => setAccountId(e.target.value)} required disabled={isPending}>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                            ))}
                        </select>
                        <select className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-medium cursor-pointer" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required disabled={isPending}>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Description"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-medium"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={isPending} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 disabled:opacity-50 active:scale-[0.97] duration-100">
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} disabled={isPending} className="px-6 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.97] duration-100">
                            Cancel
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className="p-3 flex flex-col gap-2 transition-all duration-150 hover:bg-gray-50 active:bg-gray-100/80 group rounded-xl">
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${transaction.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {transaction.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 truncate">
                                {transaction.description || "No description"}
                            </span>
                        </div>
                        {(() => {
                            const cat = categories.find((c: any) => c.id === transaction.category_id);
                            const catName = cat?.name ?? transaction.category ?? 'Uncategorized';
                            return (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                                        <span className="text-gray-400">{getCategoryIcon(cat?.icon ?? null, 10)}</span>
                                        {catName}
                                    </span>
                                    <span className="tabular-nums">{transaction.transaction_date}</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>
                
                <div className="text-right shrink-0">
                    {(() => {
                        const currencySymbol = getCurrencySymbol(transaction.currency);
                        return (
                            <span className={`font-bold tabular-nums ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{Number(transaction.amount ?? 0).toFixed(2)}
                            </span>
                        );
                    })()}
                    {transaction.currency === 'THB' && transaction.exchange_rate && (
                        <p className="text-[10px] text-gray-400 tabular-nums">
                            Rate: {Number(transaction.exchange_rate).toFixed(4)}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button 
                    onClick={() => setIsEditing(true)} 
                    disabled={isPending} 
                    className="h-7 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded px-3 text-[10px] font-bold transition-all active:scale-[0.96] disabled:opacity-50 duration-100"
                >
                    Edit
                </button>
                <button 
                    onClick={handleDelete} 
                    disabled={isPending} 
                    className="h-7 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded px-3 text-[10px] font-bold transition-all active:scale-[0.96] disabled:opacity-50 duration-100"
                >
                    Delete
                </button>
            </div>
        </li>
    );
}
