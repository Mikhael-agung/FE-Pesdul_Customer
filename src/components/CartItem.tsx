import type { CartLine } from '../cart/CartContext';
import { rupiah } from '../lib/format';

export type LineCheck = { available: boolean; stock_remaining: number; unit_price: number } | undefined;

export function CartItem({
  line,
  check,
  onQty,
  onNote,
}: {
  line: CartLine;
  check: LineCheck;
  onQty: (q: number) => void;
  onNote: (n: string) => void;
}) {
  const bad = check && (!check.available || check.stock_remaining < line.qty);
  const priceChanged = check && check.unit_price !== line.price;
  return (
    <li data-testid="cart-item" className="rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
          {line.image_url && <img src={line.image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-sm font-bold">{line.name}</h3>
          {line.spice_level !== null && <p className="text-xs text-on-surface-variant">Pedas level {line.spice_level}</p>}
          <p className="mt-1 font-headline text-sm font-bold">{rupiah(line.price)}</p>
        </div>
        <div className="flex items-center gap-1 self-start">
          <button aria-label="Kurangi" onClick={() => onQty(line.qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high">
            <span className="icon">{line.qty === 1 ? 'delete' : 'remove'}</span>
          </button>
          <span className="w-7 text-center text-sm font-bold" data-testid="qty">{line.qty}</span>
          <button aria-label="Tambah" onClick={() => onQty(line.qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="icon">add</span>
          </button>
        </div>
      </div>
      <input
        value={line.note}
        maxLength={200}
        onChange={(e) => onNote(e.target.value)}
        placeholder="Catatan (opsional), mis. tanpa bawang"
        className="mt-2 h-10 w-full rounded-lg bg-surface-container-low px-3 text-xs placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {bad && (
        <p className="mt-2 rounded-lg bg-error-container p-2 text-xs text-on-error-container">
          {check!.available ? `Stok tersisa ${check!.stock_remaining}. Kurangi jumlah.` : 'Menu ini sudah habis. Hapus dari keranjang.'}
        </p>
      )}
      {priceChanged && (
        <p className="mt-2 rounded-lg bg-amber-100 p-2 text-xs text-amber-800">
          Harga berubah menjadi {rupiah(check!.unit_price)}.
        </p>
      )}
    </li>
  );
}
