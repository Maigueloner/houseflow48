'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function FloatingQuickAdd() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 200) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const openQuickAdd = () => {
        window.dispatchEvent(new CustomEvent('hf:open-quick-add'));
    };

    return (
        <button
            onClick={openQuickAdd}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out z-50 ${
                isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
            }`}
            aria-label="Add Transaction"
        >
            <Plus size={22} />
        </button>
    );
}
