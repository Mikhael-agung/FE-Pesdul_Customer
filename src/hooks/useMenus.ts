import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Category, Menu } from '../lib/types';


export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data as Category[],
    staleTime: 5 * 60_000,
  });

export const useMenus = (categoryId?: number, q?: string) =>
  useQuery({
    queryKey: ['menus', categoryId ?? null, q ?? ''],
    queryFn: async () =>
      (await api.get('/menus', { params: { category_id: categoryId, q: q || undefined } })).data
        .data as Menu[],
    refetchInterval: 30_000, // stok terbaru; berhenti saat tab background
    placeholderData: keepPreviousData,
  });
