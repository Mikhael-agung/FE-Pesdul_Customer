import { useState } from 'react';
import type { Menu } from '../lib/types';

export function SpiceSheet({
    menu,
    onClose,
    onConfirm,
}: {
    menu: Menu;
    onClose: () => void;
    onConfirm: (level: number) => void;
}) {
    const [level, setLevel] = useState<number | null>(null);
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
            <div
                role="dialog"
                aria-label="Pilih level pedas"
                className="w-full max-w-md rounded-t-3xl bg-surface-container-lowest p-5 md:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="font-headline text-lg font-extrabold">{menu.name}</h2>
                <p className="mb-3 text-xs text-on-surface-variant">Pilih level pedas</p>
                <div className="mb-4 flex flex-wrap gap-2">
                    {menu.spice_levels.map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`h-11 min-w-16 rounded-xl px-4 text-sm font-bold ${level === l ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'
                                }`}
                        >
                            Level {l}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="h-12 flex-1 rounded-xl bg-surface-container-high font-semibold">
                        Batal
                    </button>
                    <button
                        disabled={level === null}
                        onClick={() => level !== null && onConfirm(level)}
                        className="h-12 flex-1 rounded-xl bg-primary font-headline font-bold text-on-primary disabled:opacity-50"
                    >
                        Tambah
                    </button>
                </div>
            </div>
        </div>
    );
}
