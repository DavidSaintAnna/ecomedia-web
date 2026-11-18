import type { QueryClient } from '@tanstack/react-query';
import type { Paginated, Post } from './types';

/**
 * Muda um post em todos os lugares onde ele já foi baixado (lista do Explorar e página do post), para o contador
 * mudar na hora em qualquer tela. A resposta da API continua sendo a verdade: quem chama confirma depois.
 */
export function patchPost(queryClient: QueryClient, id: number, mudar: (post: Post) => Post): void {
  for (const chave of ['posts', 'feed']) {
    queryClient.setQueriesData<Paginated<Post>>({ queryKey: [chave] }, (lista) =>
      lista ? { ...lista, data: lista.data.map((p) => (p.id === id ? mudar(p) : p)) } : lista,
    );
  }
  queryClient.setQueryData<Post>(['post', id], (post) => (post ? mudar(post) : post));
}
