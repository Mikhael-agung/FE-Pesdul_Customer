import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PaymentMethodInfo, PublicSettings } from '../lib/types';


const DEFAULT_METHODS: PaymentMethodInfo[] = [{ id: 'qris', label: 'QRIS', enabled: true }];

export const usePublicSettings = () => {
    const q = useQuery({
        queryKey: ['settings-public'],
        queryFn: async () => (await api.get('/settings/public')).data.data as PublicSettings,
        staleTime: 60_000,
    });
    const ready = q.isSuccess;
    return {
        ...q,
        ready,
        dineInFull: q.data?.dine_in_full ?? false,
        methods: ready ? (q.data?.payment_methods ?? DEFAULT_METHODS) : [],
    };
};