import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItemInput, Menu, OrderType } from '../lib/types';

export type CartLine = {
    key: string;
    menu_id: number;
    name: string;
    price: number;
    image_url: string;
    qty: number;
    spice_level: number | null;
    note: string;
};

type Ctx = {
    lines: CartLine[];
    orderType: OrderType | null;
    setOrderType: (t: OrderType | null) => void;
    add: (m: Menu, spice?: number | null, note?: string) => void;
    setQty: (key: string, qty: number) => void;
    setNote: (key: string, note: string) => void;
    remove: (key: string) => void;
    clear: () => void;
    count: number;
    total: number;
    toInput: () => CartItemInput[];
};

const KEY = 'pesduls_cart';
const MAX_QTY = 99;
const CartContext = createContext<Ctx>(null!);
export const useCart = () => useContext(CartContext);

function load(): CartLine[] {
    try {
        const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>(load);
    const [orderType, setOrderType] = useState<OrderType | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(lines));
        } catch {
            /* abaikan */
        }
    }, [lines]);

    const add: Ctx['add'] = useCallback((m, spice = null, note = '') => {
        const key = `${m.id}:${spice ?? 0}`;
        setLines((ls) => {
            const i = ls.findIndex((l) => l.key === key);
            if (i >= 0) {
                const c = [...ls];
                c[i] = { ...c[i], qty: Math.min(MAX_QTY, c[i].qty + 1), price: m.price };
                return c;
            }
            return [
                ...ls,
                { key, menu_id: m.id, name: m.name, price: m.price, image_url: m.image_url, qty: 1, spice_level: spice, note },
            ];
        });
    }, []);

    const setQty: Ctx['setQty'] = useCallback(
        (key, qty) =>
            setLines((ls) =>
                qty <= 0
                    ? ls.filter((l) => l.key !== key)
                    : ls.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
            ),
        [],
    );
    const setNote: Ctx['setNote'] = useCallback(
        (key, note) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, note: note.slice(0, 200) } : l))),
        [],
    );
    const remove = useCallback((key: string) => setLines((ls) => ls.filter((l) => l.key !== key)), []);
    const clear = useCallback(() => {
        setLines([]);
        setOrderType(null);
    }, []);

    const value = useMemo<Ctx>(
        () => ({
            lines,
            orderType,
            setOrderType,
            add,
            setQty,
            setNote,
            remove,
            clear,
            count: lines.reduce((s, l) => s + l.qty, 0),
            total: lines.reduce((s, l) => s + l.qty * l.price, 0),
            toInput: () =>
                lines.map((l) => ({
                    menu_id: l.menu_id,
                    qty: l.qty,
                    spice_level: l.spice_level,
                    note: l.note.trim() || null,
                })),
        }),
        [lines, orderType, add, setQty, setNote, remove, clear],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
