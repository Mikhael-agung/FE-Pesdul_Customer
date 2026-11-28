import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { usePublicSettings } from '../hooks/usePublicSettings';
import type { OrderType } from '../lib/types';

const OPTS: { v: OrderType; icon: string; title: string; desc: string }[] = [
  { v: 'dine_in', icon: 'restaurant', title: 'Makan di Tempat', desc: 'Makan langsung di restoran.' },
  { v: 'takeaway', icon: 'takeout_dining', title: 'Bawa Pulang', desc: 'Ambil pesanan, makan di mana saja.' },
];

export default function CheckoutType() {
  const { lines, orderType, setOrderType } = useCart();
  const nav = useNavigate();
  const { dineInFull: full } = usePublicSettings();

  if (!lines.length) return <Navigate to="/cart" replace />;

  const pick = (v: OrderType) => {
    if (v === 'dine_in' && full) return;
    setOrderType(v);
    nav('/checkout/review');
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-headline text-xl font-extrabold">Pilih Tipe Pesanan</h1>
      <p className="mb-4 text-xs text-on-surface-variant">Tipe masih bisa diganti setelah bayar, sebelum pesanan dimasak.</p>
      {full && (
        <p className="mb-3 rounded-lg bg-amber-100 p-3 text-xs text-amber-800">
          Tempat makan sedang penuh. Pilih Bawa Pulang.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {OPTS.map((o) => {
          const off = o.v === 'dine_in' && full;
          return (
            <button
              key={o.v}
              disabled={off}
              onClick={() => pick(o.v)}
              className={`flex items-center gap-4 rounded-2xl p-4 text-left shadow-sm disabled:opacity-50 ${
                orderType === o.v ? 'bg-secondary-fixed ring-2 ring-primary' : 'bg-surface-container-lowest'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span className="icon" style={{ fontSize: 26 }}>{o.icon}</span>
              </span>
              <span>
                <span className="block font-headline font-bold">{o.title}{off && ' (Penuh)'}</span>
                <span className="text-xs text-on-surface-variant">{o.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
