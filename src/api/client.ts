import { API_URL } from '../config';
import { tokenStore } from './token';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

// Todo erro da API (e também falha de rede) vira um ApiError, para as telas tratarem de um jeito só.
export class ApiError extends Error {
  /** 0 quando nem chegou resposta (rede fora do ar, CORS bloqueado, servidor dormindo). */
  readonly status: number;
  /** O campo "error" da API (ValidationError, Unauthorized, NotFound, Conflict...). */
  readonly code: string;
  /** Só nos erros 400 de validação: quais campos têm problema. */
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  /** Mensagem do erro de um campo (por exemplo "password"), se a API apontou esse campo. */
  fieldMessage(path: string): string | undefined {
    return this.details.find((d) => d.path === path)?.message;
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** false = não manda o token (usado no login e no cadastro). */
  auth?: boolean;
}

let onUnauthorized: (() => void) | null = null;

/** A tela de login registra aqui o que fazer quando o token vencer (401 com token guardado). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// Monta o endereço pulando filtros vazios: a API responde 400 para ?q= ou ?categoryId= vazios.
export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(API_URL + path);
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor === undefined || valor === null || String(valor).trim() === '') continue;
    url.searchParams.set(chave, String(valor));
  }
  return url.toString();
}

function mensagemPadrao(status: number): string {
  if (status === 401) return 'Sua sessão expirou. Entre de novo.';
  if (status === 403) return 'Você não tem permissão para fazer isso.';
  if (status === 404) return 'Não encontramos o que você procurou.';
  if (status === 429) return 'Muitas requisições. Espere alguns minutos e tente de novo.';
  if (status >= 500) return 'O servidor teve um problema. Tente de novo em instantes.';
  return 'Não foi possível concluir a ação.';
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const token = options.auth === false ? null : tokenStore.get();

  const headers: Record<string, string> = { Accept: 'application/json' };
  // Uma foto (Blob) vai como está, com o tipo dela; todo o resto vai como JSON
  const ehArquivo = body instanceof Blob;
  if (body !== undefined) headers['Content-Type'] = ehArquivo ? body.type : 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : ehArquivo ? body : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NetworkError', 'Não consegui falar com o servidor. Ele pode estar acordando; tente de novo em instantes.');
  }

  // 204 = sucesso sem corpo (excluir post, comentário, categoria ou conta)
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined; // corpo que não é JSON (por exemplo uma página de erro do servidor)
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    const erro = (data ?? {}) as { error?: string; message?: string; details?: ApiErrorDetail[] };
    throw new ApiError(
      response.status,
      erro.error ?? 'Error',
      erro.message ?? mensagemPadrao(response.status),
      Array.isArray(erro.details) ? erro.details : [],
    );
  }

  if (data === undefined) throw new ApiError(response.status, 'InvalidResponse', 'O servidor respondeu algo inesperado.');
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body ?? {}, options),
  put: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  /** Envia uma foto (bytes no corpo, sem formulário). */
  upload: <T>(path: string, foto: Blob, options?: RequestOptions) => request<T>('POST', path, foto, options),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};
