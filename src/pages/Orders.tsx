import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { dateTime, rupiah, typeLabel } from '../lib/format';
import type { OrderSummary, PageMeta } from '../lib/types';

type Page = { data: OrderSummary[]; meta: PageMeta };

export default function Orders() {
  const q = useInfiniteQuery({
    queryKey: ['orders'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      (await api.get('/orders', { params: { page: pageParam, per_page: 10 } })).data as Page,
    getNextPageParam: (l) => (l.meta.current_page < l.meta.last_page ? l.meta.current_page + 1 : undefined),
  });

  const rows = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="mx-auto max-w-xl pb-6">
      <h1 className="mb-3 font-headline text-xl font-extrabold">Riwayat Pesanan</h1>
      {q.isLoading && <p className="py-10 text-center text-sm">Memuat...</p>}
      {q.isError && <p className="py-10 text-center text-sm text-error">Gagal memuat riwayat.</p>}
      {q.isSuccess && rows.length === 0 && (
        <div className="py-16 text-center text-sm text-on-surface-variant">
          Belum ada pesanan.
          <div className="mt-3"><Link to="/" className="font-bold text-primary underline">Pesan sekarang</Link></div>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((o) => (
          <li key={o.code}>
            <Link
              to={o.status === 'pending_payment' ? `/orders/${o.code}/pay` : `/orders/${o.code}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-headline text-sm font-bold">{o.code}</p>
                <p className="text-xs text-on-surface-variant">{dateTime(o.created_at)} · {typeLabel(o.order_type)}</p>
                <p className="mt-1 text-sm font-semibold">{rupiah(o.total)}</p>
              </div>
              <StatusBadge status={o.status} label={o.status_label} />
            </Link>
          </li>
        ))}
      </ul>
      {q.hasNextPage && (
        <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="mt-4 h-11 w-full rounded-xl bg-surface-container-high text-sm font-semibold disabled:opacity-60">
          {q.isFetchingNextPage ? 'Memuat...' : 'Muat lebih banyak'}
        </button>
      )}
    </div>
  );
}
