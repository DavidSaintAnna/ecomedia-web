import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { patchPost } from './postCache';
import type { Category, Comment, LikeResponse, Paginated, Post, Stats } from './types';

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

/** Um post. `id` null = endereço inválido (por exemplo /posts/abc): nem chama a API, que responderia 400. */
export function usePost(id: number | null) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: ({ signal }) => api.get<Post>(`/api/posts/${id}`, { signal }),
    enabled: id !== null,
  });
}

const COMENTARIOS_POR_PAGINA = 20;

/** Comentários do mais antigo para o mais novo; cada "carregar mais" busca a página seguinte. */
export function useComments(postId: number) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam, signal }) =>
      api.get<Paginated<Comment>>(`/api/posts/${postId}/comments`, {
        query: { page: pageParam, limit: COMENTARIOS_POR_PAGINA },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (ultima) => (ultima.meta.page < ultima.meta.totalPages ? ultima.meta.page + 1 : undefined),
  });
}

/** Curtir e descurtir é o mesmo POST (a API alterna). O número muda na hora e depois vale o que a API respondeu. */
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; likedByMe: boolean; likesCount: number }) =>
      api.post<LikeResponse>(`/api/posts/${id}/like`),
    onMutate: ({ id }) => {
      patchPost(queryClient, id, (p) => ({
        ...p,
        likedByMe: !p.likedByMe,
        likesCount: Math.max(0, p.likesCount + (p.likedByMe ? -1 : 1)),
      }));
    },
    onError: (_erro, { id, likedByMe, likesCount }) => {
      patchPost(queryClient, id, (p) => ({ ...p, likedByMe, likesCount })); // volta ao que era
    },
    onSuccess: (resposta, { id }) => {
      patchPost(queryClient, id, (p) => ({ ...p, likedByMe: resposta.liked, likesCount: resposta.likesCount }));
    },
  });
}

export function useAddComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.post<Comment>(`/api/posts/${postId}/comments`, { content }),
    onSuccess: async () => {
      patchPost(queryClient, postId, (p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}

export function useEditComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => api.patch<Comment>(`/api/comments/${id}`, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => api.delete(`/api/comments/${commentId}`),
    onSuccess: async () => {
      patchPost(queryClient, postId, (p) => ({ ...p, commentsCount: Math.max(0, p.commentsCount - 1) }));
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: async () => {
      // por exemplo 404: o comentário já tinha sido apagado; a lista se corrige sozinha
      await queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      await queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export interface NovoPost {
  categoryId: number;
  content: string;
  imageUrl?: string;
  city?: string;
}

export interface EdicaoPost {
  categoryId?: number;
  content?: string;
  imageUrl?: string | null;
  city?: string | null;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corpo: NovoPost) => api.post<Post>('/api/posts', corpo),
    onSuccess: async (criado) => {
      queryClient.setQueryData(['post', criado.id], criado);
      await queryClient.invalidateQueries({ queryKey: ['posts'] }); // o novo post entra no topo do Explorar
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdatePost(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corpo: EdicaoPost) => api.patch<Post>(`/api/posts/${id}`, corpo),
    onSuccess: (editado) => {
      patchPost(queryClient, id, () => editado);
      // categoria e cidade podem ter mudado: as listas filtradas precisam ser buscadas de novo
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/posts/${id}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['post', id] });
      queryClient.removeQueries({ queryKey: ['comments', id] });
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
