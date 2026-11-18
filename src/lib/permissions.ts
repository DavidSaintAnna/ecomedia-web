import type { AuthUser, Post } from '../api/types';

/** Só quem escreveu a publicação ou o administrador pode editar e excluir (a API confere de novo). */
export function podeGerenciarPost(user: AuthUser | null, post: Pick<Post, 'author'>): boolean {
  return !!user && (user.role === 'ADMIN' || user.id === post.author.id);
}
