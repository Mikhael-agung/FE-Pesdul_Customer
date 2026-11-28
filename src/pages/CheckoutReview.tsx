import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '../cart/CartContext';
import { api, parseError } from '../lib/api';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { PAYMENT_LABEL, rupiah, typeLabel } from '../lib/format';
import type { Order, PaymentMethod } from '../lib/types';

const METHOD_META: Record<PaymentMethod, { icon: string; desc: string }> = {
  qris: { icon: 'qr_code_2', desc: 'Bayar sekarang dari app. Pesanan hangus bila tidak dibayar dalam 15 menit.' },
  cashier: { icon: 'point_of_sale', desc: 'Bayar tunai atau di mesin kasir saat QR pesanan discan di restoran.' },
  va: { icon: 'account_balance', desc: 'Transfer lewat nomor Virtual Account.' },
};

export default function CheckoutReview() {
  const { lines, orderType, total, toInput, clear } = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [err, setErr] = useState<{ message: string; code?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { methods } = usePublicSettings();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const lock = useRef(false); // BE tidak menangani dobel klik
  const placed = useRef(false); // pesanan sudah dibuat: jangan jalankan guard keranjang kosong

  const enabled = methods.filter((m) => m.enabled);
  // Pilihan awal: metode aktif pertama. Pilihan lama yang sudah dinonaktifkan BE dibuang.
  const chosen: PaymentMethod | null =
    method && enabled.some((m) => m.id === method) ? method : (enabled[0]?.id ?? null);

  if (placed.current) return null;
  if (!lines.length) return <Navigate to="/cart" replace />;
  if (!orderType) return <Navigate to="/checkout/type" replace />;

  const pay = async () => {
    if (lock.current || !chosen) return;
    lock.current = true;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post('/orders', { order_type: orderType, payment_method: chosen, items: toInput() });
      const order = r.data.data as Order;
      qc.setQueryData(['order', order.code], order);
      // navigate React Router bisa tertunda (transition), jadi tandai dulu agar guard tidak lompat ke /cart.
      placed.current = true;
      // QRIS: layar tagihan. Bayar di kasir: langsung ke QR pesanan.
      nav(chosen === 'cashier' ? `/orders/${order.code}` : `/orders/${order.code}/pay`, { replace: true });
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

      <h2 className="mb-2 font-headline text-base font-bold">Metode pembayaran</h2>
      <div role="radiogroup" aria-label="Metode pembayaran" className="mb-3 flex flex-col gap-2">
        {methods.map((m) => {
          const meta = METHOD_META[m.id];
          const active = chosen === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!m.enabled || busy}
              onClick={() => setMethod(m.id)}
              className={`flex items-center gap-3 rounded-2xl p-3 text-left shadow-sm disabled:opacity-50 ${
                active ? 'bg-secondary-fixed ring-2 ring-primary' : 'bg-surface-container-lowest'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span className="icon" style={{ fontSize: 24 }}>{meta.icon}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-headline text-sm font-bold">
                  {m.label || PAYMENT_LABEL[m.id]}
                  {!m.enabled && ' (Segera hadir)'}
                </span>
                <span className="block text-xs text-on-surface-variant">{meta.desc}</span>
              </span>
              <span className="icon text-primary">{active ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-3 text-xs text-on-surface-variant">Harga akhir dihitung ulang oleh sistem.</p>

      {err && (
        <div className="mb-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">
          <p>{err.message}</p>
          {err.code === 'STOCK_INSUFFICIENT' && <Link to="/cart" className="mt-1 inline-block font-bold underline">Periksa keranjang</Link>}
          {err.code === 'DINE_IN_FULL' && <Link to="/checkout/type" className="mt-1 inline-block font-bold underline">Ganti tipe pesanan</Link>}
        </div>
      )}

      <button
        onClick={pay}
        disabled={busy || !chosen}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-headline font-bold text-on-primary shadow-md disabled:opacity-60"
      >
        {busy
          ? 'Memproses...'
          : chosen === 'cashier'
            ? `Pesan, bayar di kasir ${rupiah(total)}`
            : `Bayar ${rupiah(total)}`}
      </button>
    </div>
  );
}