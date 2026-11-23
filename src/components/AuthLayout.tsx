import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm transition-all ${
    isActive
      ? 'bg-surface-container-lowest font-bold text-primary shadow-sm'
      : 'font-semibold text-on-surface-variant'
  }`;

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh md:flex md:items-center md:justify-center md:p-8">
      <main className="mx-auto w-full max-w-md px-4 pb-8 pt-6 md:rounded-3xl md:bg-surface-container-lowest md:p-8 md:shadow-lg">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src="/logo-icon.svg" alt="" className="mb-3 h-16 w-16 drop-shadow-lg" />
          <h1 className="font-headline text-2xl font-extrabold tracking-tight">PESDUL'S</h1>
          <p className="mt-1 text-sm font-semibold text-primary">Pesan Dulu Bebas Antre</p>
        </div>

        <div className="mb-4 flex rounded-xl bg-surface-container-high p-1">
          <NavLink to="/login" className={tab}>
            <span className="icon" style={{ fontSize: 18 }}>login</span>Masuk
          </NavLink>
          <NavLink to="/register" className={tab}>
            <span className="icon" style={{ fontSize: 18 }}>person_add</span>Daftar
          </NavLink>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm md:bg-transparent md:p-0 md:shadow-none">
          <h2 className="font-headline text-lg font-extrabold">{title}</h2>
          <p className="mb-4 mt-1 text-xs text-on-surface-variant">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
