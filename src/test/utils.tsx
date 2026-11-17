import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';

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
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
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
