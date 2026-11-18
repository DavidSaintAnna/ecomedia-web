import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';
import type { Paginated, Post } from '../api/types';

export function renderApp(caminho = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[caminho]}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

export const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });

export interface Chamada {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

type Rota = (chamada: Chamada) => Response | Promise<Response>;

const STATS = { users: 2, posts: 1, comments: 0, likes: 0, categories: 7, cities: 1 };

/** Troca o fetch por um falso. As rotas são "MÉTODO /caminho"; health e stats já vêm prontos. */
export function mockApi(rotas: Record<string, Rota> = {}) {
  const chamadas: Chamada[] = [];
  const todas: Record<string, Rota> = {
    'GET /api/health': () => json({ status: 'ok' }),
    'GET /api/stats': () => json(STATS),
    ...rotas,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string, init?: RequestInit) => {
      const url = new URL(entrada);
      const chamada: Chamada = {
        method: init?.method ?? 'GET',
        path: url.pathname,
        query: url.searchParams,
        body: init?.body instanceof Blob ? init.body : init?.body ? JSON.parse(String(init.body)) : undefined,
        headers: (init?.headers ?? {}) as Record<string, string>,
      };
      chamadas.push(chamada);
      const rota = todas[`${chamada.method} ${chamada.path}`];
      if (!rota) return json({ error: 'NotFound', message: `sem mock para ${chamada.method} ${chamada.path}` }, 404);
      return rota(chamada);
    }),
  );
  return chamadas;
}

export const USUARIA = {
  id: 7,
  name: 'Maria Souza',
  email: 'maria@exemplo.com',
  role: 'USER',
  city: 'Fortaleza',
  bio: null,
  avatarUrl: null,
  createdAt: '2026-11-17T09:06:33.404Z',
};

const CATEGORIAS = [
  { id: 1, name: 'Reciclagem', description: null },
  { id: 2, name: 'Hortas comunitárias', description: null },
  { id: 3, name: 'Água', description: null }, // o banco devolve "Água" por último; o site reordena
];

export const categoriasMock = CATEGORIAS;

/** Post de teste com data bem antiga (mais de 7 dias), para o texto da data ser sempre a data completa. */
export function post(id: number, extra: Partial<Post> = {}): Post {
  return {
    id,
    content: `Ação sustentável número ${id}`,
    imageUrl: null,
    city: 'Fortaleza',
    createdAt: '2026-01-05T15:00:00.000Z',
    updatedAt: '2026-01-05T15:00:00.000Z',
    author: { id: 10 + id, name: `Pessoa ${id}`, avatarUrl: null },
    category: { id: 1, name: 'Reciclagem' },
    likesCount: 0,
    commentsCount: 0,
    likedByMe: false,
    ...extra,
  };
}

/** Faz o papel da API em GET /api/posts: filtra e pagina uma lista, no mesmo formato da resposta real. */
export function responderPosts(todos: Post[]) {
  return ({ query }: Chamada): Response => {
    const page = Number(query.get('page') ?? 1);
    const limit = Number(query.get('limit') ?? 10);
    const q = query.get('q')?.toLowerCase();
    const city = query.get('city')?.toLowerCase();
    const categoryId = query.get('categoryId');
    const filtrados = todos.filter(
      (p) =>
        (!q || p.content.toLowerCase().includes(q)) &&
        (!city || (p.city ?? '').toLowerCase().includes(city)) &&
        (!categoryId || p.category.id === Number(categoryId)),
    );
    const corpo: Paginated<Post> = {
      data: filtrados.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total: filtrados.length, totalPages: Math.max(1, Math.ceil(filtrados.length / limit)) },
    };
    return json(corpo);
  };
}
