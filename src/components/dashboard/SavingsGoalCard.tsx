'use client';

import React, { useState } from 'react';
import { 
    PiggyBank, 
    ChevronDown, 
    ChevronUp, 
    Plus, 
    Edit2, 
    Trash2, 
    Check, 
    Loader2, 
    AlertCircle, 
    X 
} from 'lucide-react';
import { 
    createSavingsGoal, 
    updateSavingsGoal, 
    deleteSavingsGoal, 
    setActiveSavingsGoal 
} from '@/app/(protected)/dashboard/actions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from 'sonner';

interface SavingGoal {
    id: string;
    name: string;
    target_eur: number;
    is_active: boolean;
}

interface SavingsGoalProgress {
    goal_name: string | null;
    target_eur: number | null;
    saved_eur: number | null;
    remaining_eur: number | null;
    percent: number | null;
}

interface SavingsGoalCardProps {
    progress: SavingsGoalProgress | null;
    allGoals: SavingGoal[];
}

export default function SavingsGoalCard({ progress, allGoals }: SavingsGoalCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
    const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
    
    // Loading states
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const activeGoalFromList = allGoals.find(g => g.is_active);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing('create');
        const formData = new FormData(e.currentTarget);
        try {
            await createSavingsGoal(formData);
            toast.success('Savings goal created');
            setIsCreateOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to create savings goal');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing('update');
        const formData = new FormData(e.currentTarget);
        try {
            await updateSavingsGoal(formData);
            toast.success('Savings goal updated');
            setEditingGoal(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update savings goal');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        setIsProcessing(id);
        const formData = new FormData();
        formData.append('id', id);
        try {
            await deleteSavingsGoal(formData);
            toast.success('Savings goal deleted');
            setDeletingGoalId(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete savings goal');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleSetActive = async (id: string) => {
        setIsProcessing(`active-${id}`);
        try {
            await setActiveSavingsGoal(id);
            toast.success('Active goal updated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to set active goal');
        } finally {
            setIsProcessing(null);
        }
    };

    // Render Active Goal UI
    const renderActiveGoal = () => {
        if (!progress || !progress.goal_name) {
            return (
                <div className="flex flex-col items-center justify-center text-center space-y-2 p-8">
                    <p className="text-gray-400 font-medium text-sm">No active savings goal</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden opacity-30"></div>
                </div>
            );
        }

        const { goal_name, target_eur, saved_eur, remaining_eur, percent } = progress;
        const safePercent = percent || 0;
        const clampedPercent = Math.min(safePercent, 100);

        let progressColor = 'bg-indigo-500';
        if (safePercent >= 100) progressColor = 'bg-emerald-500';
        else if (safePercent >= 80) progressColor = 'bg-amber-500';

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 group">
                        <PiggyBank size={18} className="text-indigo-500" />
                        <h3 className="text-gray-900 font-semibold text-lg leading-tight">{goal_name}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            {activeGoalFromList && (
                                <>
                                    <button 
                                        onClick={() => setEditingGoal(activeGoalFromList)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setDeletingGoalId(activeGoalFromList.id)}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-100 mb-1">
                                Active
                            </span>
                            <span className="text-gray-900 font-medium whitespace-nowrap tabular-nums text-sm">
                                €{Number(saved_eur).toLocaleString()} / €{Number(target_eur).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                        className={`h-full ${progressColor} transition-all duration-700 ease-out`}
                        style={{ width: `${clampedPercent}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-xs">
                    <p className="text-gray-500 font-medium">
                        {safePercent >= 100 ? (
                            <span className="text-green-600 font-bold flex items-center gap-1">Goal completed 🎉</span>
                        ) : (
                            <span>€{Number(remaining_eur).toLocaleString()} remaining</span>
                        )}
                    </p>
                    <p className="text-gray-900 font-bold tabular-nums">
                        {safePercent.toFixed(1)}%
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Top Section - Active Goal */}
            <div className="p-4 bg-white">
                {renderActiveGoal()}
            </div>

            {/* Accordion Toggle */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors group"
            >
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-500 transition-colors">
                    Other goals ({allGoals.filter(g => !g.is_active).length})
                </span>
                {isExpanded ? (
                    <ChevronUp size={14} className="text-gray-400" />
                ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                )}
            </button>

            {/* Accordion Body */}
            {isExpanded && (
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-3">
                    {allGoals.map((goal) => (
                        <div 
                            key={goal.id}
                            className={`p-3 rounded-xl border transition-all ${
                                goal.is_active 
                                    ? 'bg-indigo-50/30 border-indigo-100' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                            } flex flex-col gap-2 group relative`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Radio for activation */}
                                    <button 
                                        disabled={goal.is_active || isProcessing === `active-${goal.id}`}
                                        onClick={() => handleSetActive(goal.id)}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            goal.is_active 
                                                ? 'border-indigo-500 bg-indigo-500' 
                                                : 'border-gray-300 hover:border-indigo-400 bg-white'
                                        }`}
                                    >
                                        {isProcessing === `active-${goal.id}` ? (
                                            <Loader2 size={10} className="text-gray-400 animate-spin" />
                                        ) : goal.is_active && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                        )}
                                    </button>
                                    <span className={`text-sm font-bold ${goal.is_active ? 'text-indigo-700' : 'text-gray-900'} truncate`}>
                                        {goal.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 font-bold tabular-nums">
                                        €{Number(goal.target_eur).toLocaleString()}
                                    </span>
                                    
                                    {!goal.is_active && (
                                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setEditingGoal(goal)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => setDeletingGoalId(goal.id)}
                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Inactive progress indicator */}
                            {!goal.is_active && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-200/50 h-1 rounded-full overflow-hidden">
                                        <div className="bg-gray-300 h-full w-0" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                                        €– saved
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                        <Plus size={14} />
                        Create new goal
                    </button>
                </div>
            )}

            {/* Create Goal BottomSheet */}
            <BottomSheet 
                isOpen={isCreateOpen} 
                onClose={() => { setIsCreateOpen(false); }}
                title="Create Savings Goal"
            >
                <form onSubmit={handleCreate} className="space-y-6 pb-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">
                                Goal name
                            </label>
                            <input 
                                name="name" 
                                required 
                                autoFocus
                                placeholder="e.g. New Car, Wedding..." 
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">
                                Target amount (€)
                            </label>
                            <input 
                                name="target_eur" 
                                type="number" 
                                step="0.01"
                                inputMode="decimal"
                                required 
                                placeholder="0.00" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold placeholder:text-gray-300"
                            />
                        </div>
                        <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-indigo-50/30 transition-colors group">
                            <div className="relative flex items-center">
                                <input 
                                    name="set_active" 
                                    type="checkbox" 
                                    defaultChecked={allGoals.length === 0}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-indigo-500 checked:bg-indigo-500" 
                                />
                                <Check size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">Set as active goal</span>
                        </label>
                    </div>


                    <button 
                        type="submit" 
                        disabled={isProcessing === 'create'}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-100 uppercase tracking-[0.2em]"
                    >
                        {isProcessing === 'create' ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                <span>Creating...</span>
                            </div>
                        ) : 'Create Goal'}
                    </button>
                </form>
            </BottomSheet>

            {/* Edit Goal BottomSheet */}
            <BottomSheet 
                isOpen={!!editingGoal} 
                onClose={() => { setEditingGoal(null); }}
                title="Edit Savings Goal"
            >
                {editingGoal && (
                    <form onSubmit={handleUpdate} className="space-y-6 pb-6">
                        <input type="hidden" name="id" value={editingGoal.id} />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Goal name</label>
                                <input 
                                    name="name" 
                                    required 
                                    defaultValue={editingGoal.name}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Target amount (€)</label>
                                <input 
                                    name="target_eur" 
                                    type="number" 
                                    step="0.01"
                                    inputMode="decimal"
                                    required 
                                    defaultValue={editingGoal.target_eur}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>
                        </div>


                        <button 
                            type="submit" 
                            disabled={isProcessing === 'update'}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-100 uppercase tracking-[0.2em]"
                        >
                            {isProcessing === 'update' ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Updating...</span>
                                </div>
                            ) : 'Update Goal'}
                        </button>
                    </form>
                )}
            </BottomSheet>

            {/* Delete Confirmation Overlay */}
            {deletingGoalId && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-[2.5rem] w-full max-w-sm text-center p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                         <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500/20"></div>
                        
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-500">
                            <Trash2 size={32} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delete Goal?</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                Are you sure you want to delete <span className="text-gray-900 font-bold">"{allGoals.find(g => g.id === deletingGoalId)?.name}"</span>?<br/>
                                <span className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 block">
                                    {allGoals.find(g => g.id === deletingGoalId)?.is_active ? 'Active goals cannot be deleted.' : 'This action cannot be undone.'}
                                </span>
                            </p>
                        </div>


                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => { setDeletingGoalId(null); }}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-xs transition-all active:scale-[0.95] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(deletingGoalId)}
                                disabled={isProcessing === deletingGoalId}
                                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.95] disabled:opacity-50 shadow-lg shadow-rose-100 uppercase tracking-widest"
                            >
                                {isProcessing === deletingGoalId ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </div>
                                ) : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
