'use client';

import { useState } from 'react';
import {
    Wallet,
    Edit2,
    Trash2,
    Plus,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { createAccount, renameAccount, deleteAccount } from '@/app/(protected)/dashboard/actions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getCurrencySymbol } from '@/utils/currency';
import { toast } from 'sonner';

interface Account {
    id: string;
    name: string;
    currency_code: string;
    type: string;
}

interface AccountsCardProps {
    accounts: Account[];
}

export default function AccountsCard({ accounts }: AccountsCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing('create');
        const formData = new FormData(e.currentTarget);

        try {
            await createAccount(formData);
            toast.success('Account created');
            setIsAddOpen(false);
            e.currentTarget.reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        setIsProcessing(id);
        const formData = new FormData();
        formData.append('id', id);
        formData.append('name', editingName.trim());

        try {
            await renameAccount(formData);
            toast.success('Account renamed');
            setEditingAccountId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to rename account');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        setIsProcessing(id);
        const formData = new FormData();
        formData.append('id', id);

        try {
            await deleteAccount(formData);
            toast.success('Account deleted');
            setDeletingAccountId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete account');
        } finally {
            setIsProcessing(null);
        }
    };

    const getSymbol = (code: string) => getCurrencySymbol(code);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Wallet size={16} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Management</p>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Accounts ({accounts.length})</h3>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="space-y-2 mb-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group hover:shadow-sm transition-all"
                            >
                                <div className="flex-1 flex items-center gap-3 pr-2 overflow-hidden">
                                    {editingAccountId === account.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                autoFocus
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-1 bg-gray-50 border border-indigo-200 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename(account.id);
                                                    if (e.key === 'Escape') setEditingAccountId(null);
                                                }}
                                            />
                                            <button
                                                onClick={() => handleRename(account.id)}
                                                disabled={isProcessing === account.id}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                            >
                                                {isProcessing === account.id ? (
                                                    <div className="flex items-center gap-1.5 px-1 min-w-[80px] justify-center">
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Renaming...</span>
                                                    </div>
                                                ) : <Check size={16} />}
                                            </button>
                                            <button
                                                onClick={() => setEditingAccountId(null)}
                                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm font-bold text-gray-900 truncate">{account.name}</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getSymbol(account.currency_code)}</div>
                                        </>
                                    )}
                                </div>

                                {editingAccountId !== account.id && (
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingAccountId(account.id);
                                                setEditingName(account.name);
                                            }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Rename"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingAccountId(account.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <Plus size={14} />
                        Add new account
                    </button>
                </div>
            )}

            <BottomSheet
                isOpen={isAddOpen}
                onClose={() => {
                    setIsAddOpen(false);
                }}
                title="Create Account"
            >
                <form onSubmit={handleCreate} className="space-y-6 pb-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Account name</label>
                            <input
                                name="name"
                                required
                                placeholder="Bank name, wallet, etc."
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Currency</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['EUR', 'THB'].map((code) => (
                                    <label key={code} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="currency_code"
                                            value={code}
                                            defaultChecked={code === 'EUR'}
                                            className="peer sr-only"
                                        />
                                        <div className="w-full py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-400 text-center transition-all peer-checked:bg-white peer-checked:border-indigo-500 peer-checked:text-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-500/10 hover:bg-gray-100">
                                            {code} ({getSymbol(code)})
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Initial balance (optional)</label>
                            <input
                                name="initial_balance"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold tabular-nums"
                            />
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={isProcessing === 'create'}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-200 uppercase tracking-widest"
                    >
                        {isProcessing === 'create' ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                <span>Creating...</span>
                            </div>
                        ) : (
                            <>
                                <Check size={18} />
                                Create Account
                            </>
                        )}
                    </button>
                </form>
            </BottomSheet>

            {/* Delete Confirmation Overlay */}
            {deletingAccountId && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm text-center p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20"></div>

                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Trash2 size={32} className="text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delete Account?</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                Account: <span className="text-gray-900 font-bold">{accounts.find(a => a.id === deletingAccountId)?.name}</span><br />
                                <span className="text-gray-400 italic mt-1 block text-xs">Blocked if any transactions exist.</span>
                            </p>
                        </div>


                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setDeletingAccountId(null);
                                }}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingAccountId)}
                                disabled={isProcessing === deletingAccountId}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-red-200 uppercase tracking-widest"
                            >
                                {isProcessing === deletingAccountId ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
