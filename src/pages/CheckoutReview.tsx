import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '../cart/CartContext';
import { api, parseError } from '../lib/api';
import { rupiah, typeLabel } from '../lib/format';
import type { Order } from '../lib/types';

export default function CheckoutReview() {
  const { lines, orderType, total, toInput, clear } = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [err, setErr] = useState<{ message: string; code?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false); // BE tidak menangani dobel klik
  const placed = useRef(false); // pesanan sudah dibuat: jangan jalankan guard keranjang kosong

  if (placed.current) return null;
  if (!lines.length) return <Navigate to="/cart" replace />;
  if (!orderType) return <Navigate to="/checkout/type" replace />;

  const pay = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post('/orders', { order_type: orderType, items: toInput() });
      const order = r.data.data as Order;
      qc.setQueryData(['order', order.code], order);
      // navigate React Router bisa tertunda (transition), jadi tandai dulu agar guard tidak lompat ke /cart.
      placed.current = true;
      nav(`/orders/${order.code}/pay`, { replace: true });
      clear();
    } catch (e) {
      const p = parseError(e);
      setErr({
        message:
          p.code === 'PAYMENT_GATEWAY_ERROR'
            ? 'Pembayaran sedang tidak bisa diproses. Coba lagi sebentar lagi.'
            : p.message,
        code: p.code,
      });
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl pb-6">
      <h1 className="mb-3 font-headline text-xl font-extrabold">Detail Pesanan</h1>

      <div className="mb-3 flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <div>
          <p className="text-xs text-on-surface-variant">Tipe pesanan</p>
          <p className="font-headline font-bold">{typeLabel(orderType)}</p>
        </div>
        <Link to="/checkout/type" className="text-sm font-bold text-primary">Ubah</Link>
      </div>

      <ul className="mb-3 divide-y divide-surface-container-high rounded-2xl bg-surface-container-lowest px-4 shadow-sm">
        {lines.map((l) => (
          <li key={l.key} className="flex justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{l.qty}x {l.name}</p>
              {l.spice_level !== null && <p className="text-xs text-on-surface-variant">Pedas level {l.spice_level}</p>}
              {l.note && <p className="truncate text-xs text-on-surface-variant">"{l.note}"</p>}
            </div>
            <span className="shrink-0 font-semibold">{rupiah(l.qty * l.price)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3">
          <span className="font-semibold">Total</span>
          <span className="font-headline text-lg font-extrabold">{rupiah(total)}</span>
        </li>
      </ul>

      <p className="mb-3 text-xs text-on-surface-variant">
        Bayar dengan QRIS. Pesanan hangus bila tidak dibayar dalam 15 menit. Harga akhir dihitung ulang oleh sistem.
      </p>

      {err && (
        <div className="mb-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">
          <p>{err.message}</p>
          {err.code === 'STOCK_INSUFFICIENT' && <Link to="/cart" className="mt-1 inline-block font-bold underline">Periksa keranjang</Link>}
          {err.code === 'DINE_IN_FULL' && <Link to="/checkout/type" className="mt-1 inline-block font-bold underline">Ganti tipe pesanan</Link>}
        </div>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-headline font-bold text-on-primary shadow-md disabled:opacity-60"
      >
        {busy ? 'Membuat tagihan...' : `Bayar ${rupiah(total)}`}
      </button>
    </div>
  );
}
