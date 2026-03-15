'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AnalyticsAccordionProps {
    children: React.ReactNode;
}

export default function AnalyticsAccordion({ children }: AnalyticsAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-shadow duration-150 hover:shadow-md group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
                aria-expanded={isOpen}
            >
                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Analytics</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            <div
                className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 flex flex-col gap-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
