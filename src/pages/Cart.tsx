import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { CartItem } from '../components/CartItem';
import { api, parseError } from '../lib/api';
import { rupiah } from '../lib/format';

type Check = { menu_id: number; unit_price: number; qty: number; available: boolean; stock_remaining: number };
type Result = { valid: boolean; total: number; items: Check[] };

export default function Cart() {
  const { lines, setQty, setNote, toInput, total } = useCart();
  const nav = useNavigate();
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState('');

  // Validasi ke BE tiap isi keranjang berubah (debounce).
  const sig = useMemo(() => JSON.stringify(lines.map((l) => [l.menu_id, l.qty, l.spice_level])), [lines]);
  useEffect(() => {
    if (!lines.length) {
      setRes(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await api.post('/cart/validate', { items: toInput() });
        if (!cancelled) {
          setRes(r.data.data);
          setErr('');
        }
      } catch (e) {
        if (!cancelled) setErr(parseError(e).message);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (!lines.length)
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="icon text-outline" style={{ fontSize: 56 }}>shopping_cart</span>
        <p className="text-sm text-on-surface-variant">Keranjang masih kosong.</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">Lihat menu</Link>
      </div>
    );

  const checkFor = (menuId: number) => res?.items.find((i) => i.menu_id === menuId);
  const blocked = !res || !res.valid;

  return (
    <div className="mx-auto max-w-xl pb-6">
      <h1 className="mb-3 font-headline text-xl font-extrabold">Keranjang</h1>
      <ul className="flex flex-col gap-3">
        {lines.map((l) => (
          <CartItem key={l.key} line={l} check={checkFor(l.menu_id)} onQty={(q) => setQty(l.key, q)} onNote={(n) => setNote(l.key, n)} />
        ))}
      </ul>

      {err && <p className="mt-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">{err}</p>}

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <span className="text-sm text-on-surface-variant">Total</span>
        <span data-testid="total" className="font-headline text-lg font-extrabold">{rupiah(res?.total ?? total)}</span>
      </div>

      <button
        disabled={blocked}
        onClick={() => nav('/checkout/type')}
        className="mt-4 h-12 w-full rounded-xl bg-primary font-headline font-bold text-on-primary shadow-md disabled:opacity-50"
      >
        {res ? 'Lanjut ke Checkout' : 'Memeriksa stok...'}
      </button>
    </div>
  );
}
