import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { useCategories, useMenus } from '../hooks/useMenus';
import { MenuCard } from '../components/MenuCard';
import { SpiceSheet } from '../components/SpiceSheet';
import { rupiah } from '../lib/format';
import type { Menu } from '../lib/types';

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function Home() {
  const { lines, add, count, total } = useCart();
  const [cat, setCat] = useState<number | undefined>();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const [spice, setSpice] = useState<Menu | null>(null);

  const cats = useCategories();
  const menus = useMenus(cat, dq);

  const inCart = (id: number) => lines.filter((l) => l.menu_id === id).reduce((s, l) => s + l.qty, 0);
  const onAdd = (m: Menu) => (m.has_spice_level && m.spice_levels.length ? setSpice(m) : add(m));

  const chip = (active: boolean) =>
    `h-9 shrink-0 rounded-full px-4 text-sm font-semibold ${
      active ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant shadow-sm'
    }`;

  return (
    <div className="pb-20">
      <div className="relative mb-3">
        <span className="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary">search</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari menu..."
          aria-label="Cari menu"
          className="h-12 w-full rounded-xl bg-surface-container-lowest pl-10 pr-3 text-sm shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={chip(cat === undefined)} onClick={() => setCat(undefined)}>Semua</button>
        {cats.data?.map((c) => (
          <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>

      {menus.isLoading && <p className="py-10 text-center text-sm text-on-surface-variant">Memuat menu...</p>}
      {menus.isError && (
        <div className="py-10 text-center text-sm">
          <p className="mb-2 text-error">Gagal memuat menu.</p>
          <button onClick={() => menus.refetch()} className="rounded-lg bg-surface-container-high px-4 py-2 font-semibold">Coba lagi</button>
        </div>
      )}
      {menus.data?.length === 0 && (
        <p className="py-10 text-center text-sm text-on-surface-variant">Menu tidak ditemukan.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menus.data?.map((m) => (
          <MenuCard key={m.id} menu={m} inCart={inCart(m.id)} onAdd={() => onAdd(m)} />
        ))}
      </div>

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed inset-x-4 bottom-20 z-20 mx-auto flex h-14 max-w-md items-center justify-between rounded-2xl bg-primary px-4 text-on-primary shadow-lg md:bottom-6"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="icon">shopping_cart</span>
            {count} item
          </span>
          <span className="font-headline font-bold">{rupiah(total)}</span>
        </Link>
      )}

      {spice && (
        <SpiceSheet
          menu={spice}
          onClose={() => setSpice(null)}
          onConfirm={(lvl) => {
            add(spice, lvl);
            setSpice(null);
          }}
        />
      )}
    </div>
  );
}
