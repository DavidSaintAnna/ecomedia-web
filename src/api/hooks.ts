import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Stats } from './types';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: ({ signal }) => api.get<Stats>('/api/stats', { signal }),
  });
}

/** Chamada de teste ao abrir o site: acorda a API do Render, se ela estiver dormindo. */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => api.get<{ status: string }>('/api/health', { signal }),
    retry: false,
    staleTime: Infinity,
  });
}
