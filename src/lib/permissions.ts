import type { AuthUser, Post } from '../api/types';

/** Só quem escreveu a publicação ou o administrador pode editar e excluir (a API confere de novo). */
export function podeGerenciarPost(user: AuthUser | null, post: Pick<Post, 'author'>): boolean {
  return !!user && (user.role === 'ADMIN' || user.id === post.author.id);
}

/** Telas de administração (categorias): só quem tem o papel ADMIN (a API confere de novo em cada chamada). */
export function ehAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN';
}
