import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';

const items = [
  { to: '/', icon: 'restaurant_menu', label: 'Menu', end: true },
  { to: '/orders', icon: 'receipt_long', label: 'Pesanan', end: false },
  { to: '/cart', icon: 'shopping_cart', label: 'Keranjang', end: false },
];

function CartBadge() {
  const { count } = useCart();
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
      {count}
    </span>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="" className="h-8 w-8" />
            <span className="font-headline text-base font-extrabold tracking-tight text-primary">PESDUL'S</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-secondary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`
                }
              >
                <span className="icon">{i.icon}</span>
                {i.label}
                {i.to === '/cart' && <CartBadge />}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-32 truncate text-sm text-on-surface-variant sm:block">{user?.name}</span>
            <button
              onClick={logout}
              aria-label="Keluar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            >
              <span className="icon">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-container-high bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="relative">
              <span className="icon" style={{ fontSize: 24 }}>{i.icon}</span>
              {i.to === '/cart' && <CartBadge />}
            </span>
            {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
