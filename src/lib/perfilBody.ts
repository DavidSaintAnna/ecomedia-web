import type { AuthUser } from '../api/types';

export interface ValoresPerfil {
  name: string;
  city: string;
  bio: string;
  avatarUrl: string;
}

export function valoresDoPerfil(u: AuthUser): ValoresPerfil {
  return { name: u.name, city: u.city ?? '', bio: u.bio ?? '', avatarUrl: u.avatarUrl ?? '' };
}

/** Corpo do PATCH: só o que mudou. Cidade, apresentação e foto apagadas viram null (é assim que a API limpa o campo). */
export function corpoPerfil(original: AuthUser, v: ValoresPerfil) {
  const corpo: { name?: string; city?: string | null; bio?: string | null; avatarUrl?: string | null } = {};
  if (v.name.trim() !== original.name) corpo.name = v.name.trim();
  if ((v.city.trim() || null) !== original.city) corpo.city = v.city.trim() || null;
  if ((v.bio.trim() || null) !== original.bio) corpo.bio = v.bio.trim() || null;
  if ((v.avatarUrl.trim() || null) !== original.avatarUrl) corpo.avatarUrl = v.avatarUrl.trim() || null;
  return corpo;
}
