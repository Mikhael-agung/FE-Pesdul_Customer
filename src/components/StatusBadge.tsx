import type { OrderStatus } from '../lib/types';
import { STATUS_LABEL } from '../lib/format';

const COLOR: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-blue-100 text-blue-800',
  cooking: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  picked_up: 'bg-slate-200 text-slate-700',
  expired: 'bg-error-container text-on-error-container',
};

export function StatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${COLOR[status]}`}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
