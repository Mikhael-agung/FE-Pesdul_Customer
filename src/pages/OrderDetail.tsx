import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Countdown } from '../components/Countdown';
import { StatusBadge } from '../components/StatusBadge';
import { useOrder } from '../hooks/useOrder';
import { api, parseError } from '../lib/api';
import { dateTime, rupiah, typeLabel } from '../lib/format';
import type { Order, OrderStatus, OrderType } from '../lib/types';

const STEPS: { s: OrderStatus; label: string }[] = [
  { s: 'paid', label: 'Dibayar' },
  { s: 'cooking', label: 'Dimasak' },
  { s: 'done', label: 'Siap' },
  { s: 'picked_up', label: 'Diambil' },
];

export default function OrderDetail() {
  const { code = '' } = useParams();
  const qc = useQueryClient();
  const q = useOrder(code, 10_000);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (q.isLoading) return <p className="py-10 text-center text-sm">Memuat...</p>;
  if (q.isError || !q.data) return <p className="py-10 text-center text-sm text-error">Pesanan tidak ditemukan.</p>;
  const o = q.data;

  const other: OrderType = o.order_type === 'dine_in' ? 'takeaway' : 'dine_in';

  const change = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api.patch(`/orders/${code}/type`, { order_type: other });
      qc.setQueryData(['order', code], r.data.data as Order);
      setConfirm(false);
    } catch (e) {
      const p = parseError(e);
      setErr(p.message);
      setConfirm(false);
      qc.invalidateQueries({ queryKey: ['order', code] });
    } finally {
      setBusy(false);
    }
  };

  const idx = STEPS.findIndex((s) => s.s === o.status);
  // Bayar di kasir: pesanan belum dibayar tapi QR sudah terbit untuk discan.
  const cashierPending = o.payment_method === 'cashier' && o.status === 'pending_payment';
  const showQr = !!o.qr_token && (o.status === 'paid' || cashierPending);

  return (
    <div className="mx-auto max-w-xl pb-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h1 className="font-headline text-xl font-extrabold">{o.code}</h1>
          <p className="text-xs text-on-surface-variant">{dateTime(o.created_at)} · {typeLabel(o.order_type)}</p>
        </div>
        <StatusBadge status={o.status} label={cashierPending ? 'Bayar di kasir' : o.status_label} />
      </div>

      {o.status === 'pending_payment' && !cashierPending && (
        <Link to={`/orders/${o.code}/pay`} className="mb-3 flex h-12 items-center justify-center rounded-xl bg-primary font-headline font-bold text-on-primary">
          Lanjut bayar
        </Link>
      )}
      {o.status === 'expired' && (
        <p className="mb-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">
          {o.payment_method === 'cashier'
            ? 'Pesanan kedaluwarsa karena tidak discan dan dibayar di kasir tepat waktu.'
            : 'Pesanan kedaluwarsa karena tidak dibayar dalam 15 menit.'}
        </p>
      )}

      {cashierPending && (
        <div className="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center" data-testid="cashier-banner">
          <p className="text-xs text-on-surface-variant">Bayar di kasir</p>
          <p className="font-headline text-2xl font-extrabold">{rupiah(o.total)}</p>
          <p className="mt-1 text-xs">
            Datang ke restoran dan bayar sebelum <Countdown expiresAt={o.expires_at} onExpire={() => q.refetch()} />
          </p>
        </div>
      )}

      {idx >= 0 && (
        <ol className="mb-3 flex rounded-2xl bg-surface-container-lowest p-3 shadow-sm" aria-label="Progres pesanan">
          {STEPS.map((s, i) => (
            <li key={s.s} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'}`}>
                {i < idx ? <span className="icon" style={{ fontSize: 16 }}>check</span> : i + 1}
              </span>
              <span className={`text-[11px] ${i <= idx ? 'font-bold' : 'text-outline'}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {showQr && o.qr_token && (
        <div className="mb-3 rounded-2xl bg-surface-container-lowest p-5 text-center shadow-sm">
          <p className="mb-3 text-sm font-semibold">
            {cashierPending ? 'Tunjukkan QR ini ke kasir untuk bayar dan memesan' : 'Tunjukkan QR ini ke kasir'}
          </p>
          <div className="mx-auto flex w-fit rounded-xl bg-white p-3">
            <QRCodeSVG value={o.qr_token} size={208} level="M" />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">Atau sebutkan kode pesanan</p>
          <p data-testid="order-code" className="font-headline text-lg font-extrabold tracking-wide">{o.code}</p>
        </div>
      )}

      {(o.status === 'cooking' || o.status === 'done') && (
        <div className="mb-3 rounded-2xl bg-secondary-fixed p-4 text-center">
          <p className="font-headline font-bold">{o.status === 'done' ? 'Pesanan siap, silakan ambil!' : 'Pesanan sedang dimasak'}</p>
          {o.status === 'cooking' && o.estimate_minutes !== null && (
            <p className="mt-1 text-sm">Estimasi sekitar {o.estimate_minutes} menit</p>
          )}
        </div>
      )}
      {(o.status === 'paid' || cashierPending) && o.estimate_minutes === null && (
        <p className="mb-3 text-center text-xs text-on-surface-variant">Estimasi muncul setelah QR discan kasir.</p>
      )}

      {o.can_change_type && (
        <div className="mb-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="w-full text-left text-sm font-bold text-primary">
              Ganti ke {typeLabel(other)}
            </button>
          ) : (
            <div>
              <p className="mb-3 text-sm">QR lama akan hangus dan diganti QR baru. Lanjut ganti ke <b>{typeLabel(other)}</b>?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(false)} className="h-10 flex-1 rounded-lg bg-surface-container-high text-sm font-semibold">Batal</button>
                <button onClick={change} disabled={busy} className="h-10 flex-1 rounded-lg bg-primary text-sm font-bold text-on-primary disabled:opacity-60">
                  {busy ? 'Memproses...' : 'Ya, ganti'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {err && <p className="mb-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">{err}</p>}

      <ul className="divide-y divide-surface-container-high rounded-2xl bg-surface-container-lowest px-4 shadow-sm">
        {o.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{i.qty}x {i.name}</p>
              {i.spice_level !== null && <p className="text-xs text-on-surface-variant">Pedas level {i.spice_level}</p>}
              {i.note && <p className="truncate text-xs text-on-surface-variant">"{i.note}"</p>}
            </div>
            <span className="shrink-0 font-semibold">{rupiah(i.qty * i.unit_price)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3">
          <span className="font-semibold">Total</span>
          <span className="font-headline font-extrabold">{rupiah(o.total)}</span>
        </li>
      </ul>
    </div>
  );
}