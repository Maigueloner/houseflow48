'use client';

import { useState } from 'react';
import { 
    Clock, 
    Edit2, 
    Pause, 
    Play, 
    Trash2, 
    Calendar,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { toggleRecurringTemplate, deleteRecurringTemplate, updateRecurringTemplate } from '@/app/(protected)/dashboard/actions';
import { getCurrencySymbol } from '@/utils/currency';
import { toast } from 'sonner';

interface RecurringTemplate {
    id: string;
    name: string;
    amount_original: number;
    currency_code: string;
    account_id: string;
    account_name: string;
    category_id: string;
    category_name: string;
    frequency: string;
    day_of_month: number;
    month_of_year: number | null;
    is_active: boolean;
}

interface RecurringTemplatesCardProps {
    templates: RecurringTemplate[];
    accounts: any[];
    categories: any[];
}

export default function RecurringTemplatesCard({ templates, accounts, categories }: RecurringTemplatesCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const hasNoTemplates = templates.length === 0;

    if (hasNoTemplates && !isExpanded) return null;

    const handleToggle = async (id: string) => {
        setIsProcessing(id);
        try {
            await toggleRecurringTemplate(id);
            toast.success('Template updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to toggle template');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        setIsProcessing(id);
        try {
            await deleteRecurringTemplate(id);
            toast.success('Template deleted');
            setIsDeleting(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete template');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTemplate) return;

        setIsProcessing(editingTemplate.id);
        const formData = new FormData(e.currentTarget);
        
        try {
            await updateRecurringTemplate(formData);
            toast.success('Template updated');
            setEditingTemplate(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update template');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Clock size={16} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Management</p>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Recurring Templates ({templates.length})</h3>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isExpanded && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="space-y-3">
                        {templates.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                                    <Clock size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Focus on Frequency</p>
                                    <p className="text-xs text-gray-400 font-medium max-w-[200px]">
                                        No recurring templates yet. Set up templates for recurring expenses.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            templates.map((template) => (
                                <div 
                                    key={template.id}
                                    className={`p-4 rounded-xl border transition-all ${
                                        template.is_active 
                                        ? 'bg-white border-gray-200' 
                                        : 'bg-gray-50 border-gray-100 opacity-60'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-widest">
                                                    {template.frequency}
                                                </span>
                                                {!template.is_active && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 uppercase tracking-widest">
                                                        Paused
                                                    </span>
                                                )}
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{template.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    Day {template.day_of_month}
                                                    {template.frequency === 'yearly' && template.month_of_year && ` of ${new Date(2000, template.month_of_year - 1).toLocaleString(undefined, { month: 'long' })}`}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                <span className="truncate">{template.account_name}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                <span className="truncate">{template.category_name}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                                            <p className="text-base font-black text-gray-900 tabular-nums leading-none whitespace-nowrap">
                                                {template.amount_original.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{template.currency_code}</p>
                                            
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => handleToggle(template.id)}
                                                    disabled={isProcessing === template.id}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        template.is_active 
                                                        ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' 
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={template.is_active ? "Pause" : "Resume"}
                                                >
                                                    {template.is_active ? <Pause size={14} /> : <Play size={14} />}
                                                </button>
                                                <button 
                                                    onClick={() => setEditingTemplate(template)}
                                                    disabled={isProcessing === template.id}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setIsDeleting(template.id)}
                                                    disabled={isProcessing === template.id}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md my-auto shadow-2xl relative overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                                    <Edit2 size={14} className="text-indigo-500" />
                                    Edit Template
                                </h3>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Frequency: {editingTemplate.frequency}</p>
                            </div>
                            <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-6">
                            <input type="hidden" name="id" value={editingTemplate.id} />
                            
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Name</label>
                                        <input 
                                            name="name"
                                            defaultValue={editingTemplate.name}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount ({editingTemplate.currency_code})</label>
                                            <input 
                                                name="amount"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                inputMode="decimal"
                                                defaultValue={editingTemplate.amount_original}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold tabular-nums"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Day of Month</label>
                                            <input 
                                                name="day_of_month"
                                                type="number"
                                                min="1"
                                                max="31"
                                                defaultValue={editingTemplate.day_of_month}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold tabular-nums"
                                            />
                                        </div>
                                    </div>

                                    {editingTemplate.frequency === 'yearly' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Month of Year</label>
                                            <select 
                                                name="month_of_year"
                                                defaultValue={editingTemplate.month_of_year || 1}
                                                required
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium cursor-pointer"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                        {new Date(2000, i).toLocaleString(undefined, { month: 'long' })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Account</label>
                                        <select 
                                            name="account_id"
                                            defaultValue={editingTemplate.account_id}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium cursor-pointer"
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({getCurrencySymbol(acc.currency_code || acc.currency)})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Category</label>
                                        <select 
                                            name="category_id"
                                            defaultValue={editingTemplate.category_id}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium cursor-pointer"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isProcessing === editingTemplate.id}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-200 uppercase tracking-widest"
                            >
                                {isProcessing === editingTemplate.id ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={18} className="animate-spin text-white" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm text-center p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20"></div>
                        
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delete Template?</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                This will stop future reminders. <br />
                                <span className="text-gray-400 italic mt-1 block text-xs">Past transactions will be preserved.</span>
                            </p>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setIsDeleting(null)}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(isDeleting)}
                                disabled={isProcessing === isDeleting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-red-200 uppercase tracking-widest"
                            >
                                {isProcessing === isDeleting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-white" />
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
