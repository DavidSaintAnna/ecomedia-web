// Formatos de resposta da API (copiados de respostas reais; veja a aba Contrato da API do plano).
// Campo vazio vem como null, nunca ausente. Datas vêm em UTC (ISO com Z).

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Stats {
  users: number;
  posts: number;
  comments: number;
  likes: number;
  categories: number;
  cities: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Author {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  author: Author;
  category: { id: number; name: string };
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  author: Author;
}

export interface Profile {
  id: number;
  name: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  followedByMe: boolean;
}

export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface Person {
  id: number;
  name: string;
  city: string | null;
  avatarUrl: string | null;
}

export interface RankingItem extends Person {
  rank: number;
  postsCount: number;
  likesReceived: number;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}
