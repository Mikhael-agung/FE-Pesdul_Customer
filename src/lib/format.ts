import type { OrderStatus, OrderType, PaymentMethod } from './types';

const idr = new Intl.NumberFormat('id-ID');
export const rupiah = (n: number) => `Rp ${idr.format(n)}`;

export const typeLabel = (t: OrderType) => (t === 'dine_in' ? 'Makan di Tempat' : 'Bawa Pulang');

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  cashier: 'Bayar di Kasir',
  va: 'Virtual Account',
};

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Menunggu pembayaran',
  paid: 'Dibayar',
  cooking: 'Dimasak',
  done: 'Siap diambil',
  picked_up: 'Diambil',
  expired: 'Kedaluwarsa',
};

export const isFinal = (s?: OrderStatus) => s === 'picked_up' || s === 'expired';
