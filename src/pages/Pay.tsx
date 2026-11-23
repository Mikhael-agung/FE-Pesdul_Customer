import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Countdown } from '../components/Countdown';
import { useOrder } from '../hooks/useOrder';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { api, parseError } from '../lib/api';
import { rupiah } from '../lib/format';
import type { Order } from '../lib/types';

export default function Pay() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const order = useOrder(code);
  const pending = order.data?.status === 'pending_payment';
  const status = usePaymentStatus(code, !!pending);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Status berubah dari polling: sinkronkan order, lalu pindah ke detail bila sudah dibayar.
  const os = status.data?.order_status;
  useEffect(() => {
    if (!os || os === 'pending_payment') return;
    qc.invalidateQueries({ queryKey: ['order', code] });
    if (os === 'paid') nav(`/orders/${code}`, { replace: true });
  }, [os, code, nav, qc]);

  if (order.isLoading) return <p className="py-10 text-center text-sm">Memuat...</p>;
  if (order.isError || !order.data)
    return <p className="py-10 text-center text-sm text-error">Pesanan tidak ditemukan.</p>;

  const o = order.data;
  const pay = status.data?.payment ?? o.payment;

  if (o.status === 'expired')
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-16 text-center">
        <span className="icon text-error" style={{ fontSize: 56 }}>timer_off</span>
        <h1 className="font-headline text-lg font-extrabold">Pesanan kedaluwarsa</h1>
        <p className="text-sm text-on-surface-variant">Waktu pembayaran 15 menit habis. Silakan buat pesanan baru.</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">Kembali ke menu</Link>
      </div>
    );

  if (!pending)
    return (
      <div className="py-16 text-center">
        <Link to={`/orders/${code}`} className="font-bold text-primary underline">Lihat pesanan</Link>
      </div>
    );

  const failed = pay && (pay.status === 'failed' || pay.status === 'expired');

  const retry = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await api.post(`/orders/${code}/payment/retry`);
      qc.setQueryData(['order', code], r.data.data as Order);
      qc.invalidateQueries({ queryKey: ['pay-status', code] });
    } catch (e) {
      setMsg(parseError(e).message);
      qc.invalidateQueries({ queryKey: ['order', code] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-headline text-xl font-extrabold">Bayar dengan QRIS</h1>
      <p className="mt-1 text-xs text-on-surface-variant">Kode pesanan {o.code}</p>

      <div className="my-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
        <p className="text-xs text-on-surface-variant">Sisa waktu bayar</p>
        <p className="font-headline text-3xl font-extrabold">
          <Countdown expiresAt={o.expires_at} onExpire={() => qc.invalidateQueries({ queryKey: ['order', code] })} />
        </p>

        <div className="mx-auto my-4 flex w-fit rounded-xl bg-white p-3">
          {failed ? (
            <div className="flex h-56 w-56 items-center justify-center text-sm text-error">Tagihan gagal/kedaluwarsa</div>
          ) : pay?.qr_string ? (
            <QRCodeSVG value={pay.qr_string} size={224} level="M" />
          ) : pay?.qr_url ? (
            <img src={pay.qr_url} alt="QRIS" className="h-56 w-56" />
          ) : (
            <div className="h-56 w-56" />
          )}
        </div>

        <p className="text-xs text-on-surface-variant">Total</p>
        <p className="font-headline text-xl font-extrabold">{rupiah(o.total)}</p>
      </div>

      {msg && <p className="mb-3 rounded-lg bg-error-container p-3 text-xs text-on-error-container">{msg}</p>}

      {failed ? (
        <button onClick={retry} disabled={busy} className="h-12 w-full rounded-xl bg-primary font-headline font-bold text-on-primary disabled:opacity-60">
          {busy ? 'Membuat ulang...' : 'Buat ulang tagihan'}
        </button>
      ) : (
        <button
          onClick={() => status.refetch()}
          disabled={status.isFetching}
          className="h-12 w-full rounded-xl bg-primary font-headline font-bold text-on-primary disabled:opacity-60"
        >
          {status.isFetching ? 'Memeriksa...' : 'Cek status pembayaran'}
        </button>
      )}
      <p className="mt-3 text-xs text-on-surface-variant">Status diperiksa otomatis tiap 5 detik.</p>
    </div>
  );
}
