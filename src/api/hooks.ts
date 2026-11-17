import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Category, Paginated, Post, Stats } from './types';

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

export interface PostFilters {
  q?: string;
  city?: string;
  categoryId?: number;
  page: number;
  limit: number;
}

/** Lista de publicações. Ao trocar de página mantém a anterior na tela até a nova chegar (sem piscar). */
export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: ({ signal }) => api.get<Paginated<Post>>('/api/posts', { query: { ...filters }, signal }),
    placeholderData: keepPreviousData,
  });
}

/** Categorias (a API devolve lista simples, sem paginação). Ordenadas em português: o banco põe "Água" por último. */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => {
      const lista = await api.get<Category[]>('/api/categories', { signal });
      return [...lista].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
    staleTime: 5 * 60_000,
  });
}
