import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reduzirImagem, type OpcoesDeReducao } from '../lib/imagem';
import { api } from './client';
import { patchPost } from './postCache';
import type { Category, Comment, FollowResponse, ImagemEnviada, LikeResponse, Paginated, Person, Post, Profile, RankingItem, Stats } from './types';

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
  authorId?: number;
  page: number;
  limit: number;
}

/** Lista de publicações. Ao trocar de página mantém a anterior na tela até a nova chegar (sem piscar). */
export function usePosts(filters: PostFilters, enabled = true) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: ({ signal }) => api.get<Paginated<Post>>('/api/posts', { query: { ...filters }, signal }),
    placeholderData: keepPreviousData,
    enabled,
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
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
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
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/** Perfil público de uma pessoa. `id` null = endereço inválido (/pessoas/abc): nem chama a API. */
export function useProfile(id: number | null) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: ({ signal }) => api.get<Profile>(`/api/users/${id}`, { signal }),
    enabled: id !== null,
  });
}

export type ListaDePessoas = 'followers' | 'following';

/** Quem segue a pessoa (followers) ou quem ela segue (following), 10 por página. */
export function usePessoas(id: number | null, tipo: ListaDePessoas, page: number, enabled = true) {
  return useQuery({
    queryKey: ['pessoas', id, tipo, page],
    queryFn: ({ signal }) => api.get<Paginated<Person>>(`/api/users/${id}/${tipo}`, { query: { page, limit: 10 }, signal }),
    enabled: enabled && id !== null,
    placeholderData: keepPreviousData,
  });
}

/** Seguir e deixar de seguir é o mesmo POST (a API alterna). O botão muda na hora e depois vale o que a API respondeu. */
export function useToggleFollow(id: number, meuId: number | undefined) {
  const queryClient = useQueryClient();
  const mudarPerfil = (mudar: (p: Profile) => Profile) => queryClient.setQueryData<Profile>(['profile', id], (p) => (p ? mudar(p) : p));
  return useMutation({
    mutationFn: (_atual: { followedByMe: boolean; followersCount: number }) => api.post<FollowResponse>(`/api/users/${id}/follow`),
    onMutate: () => {
      mudarPerfil((p) => ({
        ...p,
        followedByMe: !p.followedByMe,
        followersCount: Math.max(0, p.followersCount + (p.followedByMe ? -1 : 1)),
      }));
    },
    onError: (_erro, atual) => {
      mudarPerfil((p) => ({ ...p, ...atual })); // volta ao que era
    },
    onSuccess: (resposta) => {
      mudarPerfil((p) => ({ ...p, followedByMe: resposta.following, followersCount: resposta.followersCount }));
    },
    onSettled: () => {
      // as listas dessa pessoa e as minhas contagens mudaram
      void queryClient.invalidateQueries({ queryKey: ['pessoas', id] });
      if (meuId) {
        void queryClient.invalidateQueries({ queryKey: ['pessoas', meuId] });
        void queryClient.invalidateQueries({ queryKey: ['profile', meuId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/** Publicações de quem eu sigo, as mais novas primeiro. */
export function useFeed(page: number) {
  return useQuery({
    queryKey: ['feed', page],
    queryFn: ({ signal }) => api.get<Paginated<Post>>('/api/feed', { query: { page, limit: 10 }, signal }),
    placeholderData: keepPreviousData,
  });
}

/** Ranking de quem mais recebeu curtidas nas próprias publicações (a API devolve lista simples). */
export function useRanking(city: string, limit: number) {
  return useQuery({
    queryKey: ['ranking', city, limit],
    queryFn: ({ signal }) => api.get<RankingItem[]>('/api/leaderboard', { query: { city: city || undefined, limit }, signal }),
    placeholderData: keepPreviousData,
  });
}

export interface EdicaoPerfil {
  name?: string;
  city?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

/** Editar o meu perfil. O que mudou (nome, foto) aparece em publicações, comentários e listas já baixados: baixa de novo. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corpo: EdicaoPerfil) => api.patch<Profile>('/api/users/me', corpo),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api.delete('/api/users/me') });
}

/** Reduz a foto no navegador e envia para a API. Devolve o link para usar em avatarUrl / imageUrl. */
export function useEnviarFoto() {
  return useMutation({
    mutationFn: async ({ arquivo, opcoes }: { arquivo: File; opcoes: OpcoesDeReducao }) => {
      const pequena = await reduzirImagem(arquivo, opcoes);
      return api.upload<ImagemEnviada>('/api/images', pequena);
    },
  });
}
