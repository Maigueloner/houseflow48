'use client';

import { useState } from 'react';
import {
    Tag,
    Edit2,
    Trash2,
    Plus,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { createCategory, renameCategory, deleteCategory } from '@/app/(protected)/dashboard/actions';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getCategoryIcon, AVAILABLE_ICONS } from '@/utils/categoryIcon';
import { toast } from 'sonner';

interface Category {
    id: string;
    name: string;
    icon: string | null;
}

interface CategoriesCardProps {
    categories: Category[];
}

export default function CategoriesCard({ categories }: CategoriesCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Inline rename state
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingIcon, setEditingIcon] = useState<string>('tag');

    // Delete state
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

    // Loading
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // Add form state
    const [newIcon, setNewIcon] = useState<string>('tag');

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing('create');
        const formData = new FormData(e.currentTarget);
        formData.set('icon', newIcon);

        try {
            await createCategory(formData);
            toast.success('Category created');
            setIsAddOpen(false);
            setNewIcon('tag');
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create category');
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
        formData.append('icon', editingIcon || 'tag');

        try {
            await renameCategory(formData);
            toast.success('Category updated');
            setEditingCategoryId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to rename category');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDelete = async (id: string) => {
        setIsProcessing(id);
        const formData = new FormData();
        formData.append('id', id);

        try {
            await deleteCategory(formData);
            toast.success('Category deleted');
            setDeletingCategoryId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete category');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Tag size={16} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Management</p>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                            Categories ({categories.length})
                        </h3>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                )}
            </button>

            {/* Expanded Body */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="space-y-2 mb-4">
                        {categories.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                                    <Tag size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Organize Life</p>
                                    <p className="text-xs text-gray-400 font-medium max-w-[200px]">
                                        No categories found. Add categories to better organize your spending.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group hover:shadow-sm transition-all"
                                >
                                <div className="flex-1 flex items-center gap-3 pr-2 overflow-hidden">
                                    {editingCategoryId === category.id ? (
                                        <div className="flex-1 flex flex-col gap-3">
                                            {/* Name input */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="flex-1 bg-gray-50 border border-indigo-200 rounded-lg px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRename(category.id);
                                                        if (e.key === 'Escape') setEditingCategoryId(null);
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleRename(category.id)}
                                                    disabled={isProcessing === category.id}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                >
                                                    {isProcessing === category.id ? (
                                                        <div className="flex items-center gap-1.5 px-1">
                                                            <Loader2 size={16} className="animate-spin" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Renaming...</span>
                                                        </div>
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setEditingCategoryId(null)}
                                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            {/* Icon picker (edit mode) */}
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {AVAILABLE_ICONS.map((iconName) => (
                                                    <button
                                                        key={iconName}
                                                        type="button"
                                                        onClick={() => setEditingIcon(iconName)}
                                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                                                            editingIcon === iconName
                                                                ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500/20'
                                                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                        title={iconName}
                                                    >
                                                        {getCategoryIcon(iconName, 14)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-gray-500 shrink-0">
                                                {getCategoryIcon(category.icon, 16)}
                                            </span>
                                            <div className="text-sm font-bold text-gray-900 truncate">
                                                {category.name}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {editingCategoryId !== category.id && (
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingCategoryId(category.id);
                                                setEditingName(category.name);
                                                setEditingIcon(category.icon || 'tag');
                                            }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Rename"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeletingCategoryId(category.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )))}
                    </div>

                    <button
                        onClick={() => {
                            setIsAddOpen(true);
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <Plus size={14} />
                        Add new category
                    </button>
                </div>
            )}

            {/* Add Category BottomSheet */}
            <BottomSheet
                isOpen={isAddOpen}
                onClose={() => {
                    setIsAddOpen(false);
                    setNewIcon('tag');
                }}
                title="Create Category"
            >
                <form onSubmit={handleCreate} className="space-y-6 pb-4">
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                Category name
                            </label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Restaurantes"
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            />
                        </div>

                        {/* Icon Picker */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                Icon
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {AVAILABLE_ICONS.map((iconName) => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setNewIcon(iconName)}
                                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                                            newIcon === iconName
                                                ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500/20'
                                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                        title={iconName}
                                    >
                                        {getCategoryIcon(iconName, 18)}
                                    </button>
                                ))}
                            </div>
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
                                Create Category
                            </>
                        )}
                    </button>
                </form>
            </BottomSheet>

            {/* Delete Confirmation Overlay */}
            {deletingCategoryId && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm text-center p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20"></div>

                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Trash2 size={32} className="text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                Delete Category?
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">
                                Category:{' '}
                                <span className="text-gray-900 font-bold">
                                    {categories.find((c) => c.id === deletingCategoryId)?.name}
                                </span>
                                <br />
                                <span className="text-gray-400 italic mt-1 block text-xs">
                                    Blocked if any transactions exist.
                                </span>
                            </p>
                        </div>


                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setDeletingCategoryId(null);
                                }}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingCategoryId)}
                                disabled={isProcessing === deletingCategoryId}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-red-200 uppercase tracking-widest"
                            >
                                {isProcessing === deletingCategoryId ? (
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
