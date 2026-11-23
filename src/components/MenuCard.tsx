import type { Menu } from '../lib/types';
import { rupiah } from '../lib/format';

export function MenuCard({ menu, inCart, onAdd }: { menu: Menu; inCart: number; onAdd: () => void }) {
  const out = !menu.is_available;
  return (
    <article
      data-testid="menu-card"
      className="flex gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm sm:flex-col"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-low sm:h-40 sm:w-full">
        {menu.image_url && (
          <img
            src={menu.image_url}
            alt={menu.name}
            loading="lazy"
            className={`h-full w-full object-cover ${out ? 'grayscale' : ''}`}
          />
        )}
        {out && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-bold text-white">
            Habis
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="font-headline text-sm font-bold leading-tight">{menu.name}</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {menu.category?.name}
            {!out && menu.stock_remaining <= 5 && (
              <span className="ml-1.5 font-semibold text-error">Sisa {menu.stock_remaining}</span>
            )}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-headline text-[15px] font-bold">{rupiah(menu.price)}</span>
          <button
            disabled={out}
            onClick={onAdd}
            aria-label={`Tambah ${menu.name}`}
            className="flex h-9 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-on-primary active:scale-95 disabled:bg-surface-container-high disabled:text-outline"
          >
            <span className="icon" style={{ fontSize: 18 }}>add</span>
            {inCart > 0 ? inCart : 'Tambah'}
          </button>
        </div>
      </div>
    </article>
  );
}
