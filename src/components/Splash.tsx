import { useEffect, useState, type ReactNode } from 'react';

const KEY = 'pesduls_splash';
const seen = () => {
    try {
        return !!sessionStorage.getItem(KEY);
    } catch {
        return false;
    }
};

export function Splash({ children }: { children: ReactNode }) {
    const [phase, setPhase] = useState<'show' | 'fade' | 'done'>(seen() ? 'done' : 'show');

    useEffect(() => {
        if (phase === 'done') return;
        const t1 = setTimeout(() => setPhase('fade'), 5600);
        const t2 = setTimeout(() => {
            try {
                sessionStorage.setItem(KEY, '1');
            } catch {
                /* abaikan */
            }
            setPhase('done');
        }, 1800);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [phase === 'done']); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            {children}
            {phase !== 'done' && (
                <div
                    data-testid="splash"
                    className={`fixed inset-0 z-100 flex items-center justify-center bg-[#FFF4E6] transition-opacity duration-300 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    <img src="/logo-full.svg" alt="PESDUL'S" className="w-64 max-w-[70vw] animate-pulse" />
                </div>
            )}
        </>
    );
}
