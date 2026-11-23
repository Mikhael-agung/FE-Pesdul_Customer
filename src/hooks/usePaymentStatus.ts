import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { OrderStatus, Payment } from '../lib/types';

export type PaymentStatus = { order_status: OrderStatus; payment: Payment };

export const usePaymentStatus = (code: string, enabled: boolean) =>
  useQuery({
    queryKey: ['pay-status', code],
    queryFn: async () => (await api.get(`/orders/${code}/payment/status`)).data.data as PaymentStatus,
    enabled,
    refetchInterval: 5000,
  });
