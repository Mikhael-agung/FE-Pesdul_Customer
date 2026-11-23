import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isFinal } from '../lib/format';
import type { Order } from '../lib/types';

export const useOrder = (code: string, pollMs: number | false = false) =>
  useQuery({
    queryKey: ['order', code],
    queryFn: async () => (await api.get(`/orders/${code}`)).data.data as Order,
    refetchInterval: (q) => (pollMs && !isFinal(q.state.data?.status) ? pollMs : false),
  });
