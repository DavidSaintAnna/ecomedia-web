import type { Post } from '../api/types';

export interface ValoresPost {
  categoryId: string;
  content: string;
  imageUrl: string;
  city: string;
}

export function valoresIniciais(post?: Post): ValoresPost {
  return {
    categoryId: post ? String(post.category.id) : '',
    content: post?.content ?? '',
    imageUrl: post?.imageUrl ?? '',
    city: post?.city ?? '',
  };
}

/** Corpo do POST: campos opcionais vazios ficam de fora (a API não aceita '' nem null na criação). */
export function corpoNovo(v: ValoresPost) {
  const corpo: { categoryId: number; content: string; imageUrl?: string; city?: string } = {
    categoryId: Number(v.categoryId),
    content: v.content.trim(),
  };
  if (v.imageUrl.trim()) corpo.imageUrl = v.imageUrl.trim();
  if (v.city.trim()) corpo.city = v.city.trim();
  return corpo;
}

/** Corpo do PATCH: só o que mudou. Imagem ou cidade apagadas viram null (é assim que a API limpa o campo). */
export function corpoEdicao(original: Post, v: ValoresPost) {
  const corpo: { categoryId?: number; content?: string; imageUrl?: string | null; city?: string | null } = {};
  if (Number(v.categoryId) !== original.category.id) corpo.categoryId = Number(v.categoryId);
  if (v.content.trim() !== original.content) corpo.content = v.content.trim();
  if ((v.imageUrl.trim() || null) !== original.imageUrl) corpo.imageUrl = v.imageUrl.trim() || null;
  if ((v.city.trim() || null) !== original.city) corpo.city = v.city.trim() || null;
  return corpo;
}
