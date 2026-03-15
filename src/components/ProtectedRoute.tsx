'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/login');
        }
    }, [loading, session, router]);

    if (loading) {
        return <main style={{ padding: '2rem' }}>Loading...</main>;
    }

    if (!session) {
        return null;
    }

    return <>{children}</>;
};
