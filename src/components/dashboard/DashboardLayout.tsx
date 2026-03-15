'use client';

import React, { useState, useEffect } from 'react';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface DashboardLayoutProps {
    children: React.ReactNode;
    quickAddNode?: React.ReactNode;
}

export default function DashboardLayout({ children, quickAddNode }: DashboardLayoutProps) {
    const [isFabSheetOpen, setIsFabSheetOpen] = useState(false);

    useEffect(() => {
        const handleOpenQuickAdd = () => setIsFabSheetOpen(true);
        window.addEventListener('hf:open-quick-add', handleOpenQuickAdd);
        return () => window.removeEventListener('hf:open-quick-add', handleOpenQuickAdd);
    }, []);

    return (
        <main className="min-h-screen bg-[#F7F8FA] text-gray-900 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-4 pb-32">
                {children}
            </div>

            {quickAddNode && (
                <>
                    <FloatingActionButton onClick={() => setIsFabSheetOpen(true)} />
                    <BottomSheet
                        isOpen={isFabSheetOpen}
                        onClose={() => setIsFabSheetOpen(false)}
                        title="Add Transaction"
                    >
                        {/* We add a wrapper to ensure it looks good in the bottom sheet */}
                        <div className="pb-6" onClick={() => setIsFabSheetOpen(false)}>
                            {/* We clone or just render the node. If it's the QuickAdd section, clicking inside shouldn't close it, so we stop propagation on the inner div */}
                            <div onClick={(e) => e.stopPropagation()}>
                                {quickAddNode}
                            </div>
                        </div>
                    </BottomSheet>
                </>
            )}
        </main>
    );
}
