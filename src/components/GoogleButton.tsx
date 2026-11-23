import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { parseError } from '../lib/api';

type GsiId = {
    initialize: (c: { client_id: string; callback: (r: { credential: string }) => void }) => void;
    renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
    interface Window {
        google?: { accounts: { id: GsiId } };
    }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleButton({ onError }: { onError: (msg: string) => void }) {
    const { loginGoogle } = useAuth();
    const nav = useNavigate();
    const box = useRef<HTMLDivElement>(null);
    const errRef = useRef(onError);
    errRef.current = onError;

    useEffect(() => {
        if (!CLIENT_ID) return;
        let tries = 0;
        // Script GIS dimuat async di index.html: tunggu sampai siap (maks ~5 dtk).
        const t = setInterval(() => {
            const gsi = window.google?.accounts.id;
            if (!gsi && ++tries < 50) return;
            clearInterval(t);
            if (!gsi || !box.current) return;
            gsi.initialize({
                client_id: CLIENT_ID,
                callback: async ({ credential }) => {
                    try {
                        await loginGoogle(credential);
                        nav('/', { replace: true });
                    } catch (e) {
                        const p = parseError(e);
                        errRef.current(
                            p.code === 'GOOGLE_ACCOUNT_CONFLICT'
                                ? 'Email ini sudah terdaftar dengan kata sandi. Masuk dengan sandi dulu, lalu tautkan Google di pengaturan.'
                                : p.message,
                        );
                    }
                },
            });
            gsi.renderButton(box.current, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                locale: 'id',
                width: Math.min(400, box.current.offsetWidth || 320),
            });
        }, 100);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!CLIENT_ID) return null; // tanpa client id, bagian Google disembunyikan

    return (
        <div className="mt-4">
            <div className="relative mb-4 flex items-center justify-center">
                <div className="h-px w-full bg-surface-container-high" />
                <span className="absolute bg-surface-container-lowest px-3 text-xs text-on-surface-variant">
                    atau masuk lebih cepat dengan
                </span>
            </div>
            <div ref={box} data-testid="google-btn" className="flex min-h-11 justify-center" />
        </div>
    );
}