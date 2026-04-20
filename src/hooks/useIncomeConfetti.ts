import { useRef } from 'react';

export function useIncomeConfetti() {
    const lastFiredAt = useRef<number>(0);
    const cooldownMs = 1500;

    const fireConfetti = async () => {
        const now = Date.now();
        if (now - lastFiredAt.current < cooldownMs) {
            return;
        }

        try {
            const confetti = (await import('canvas-confetti')).default;
            
            lastFiredAt.current = now;

            confetti({
                particleCount: 80,
                spread: 70,
                origin: { x: 0.5, y: 0.7 },
                scalar: 0.8,
                colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
                ticks: 200,
                gravity: 1.2,
                zIndex: 9999,
            });
        } catch (error) {
            console.error('Failed to fire confetti:', error);
        }
    };

    return { fireConfetti };
}
