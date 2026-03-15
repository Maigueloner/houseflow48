'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browserClient';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
    const supabase = getSupabaseBrowserClient();
    const router = useRouter();
    const { session, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session && !authLoading) {
            router.replace('/dashboard');
        }
    }, [session, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
        }
        // We don't manually redirect; AuthProvider state change will trigger useEffect
    };

    if (authLoading || session) {
        return <main style={{ padding: '2rem' }}>Loading...</main>;
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Login</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%' }}
                    />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </main>
    );
}
