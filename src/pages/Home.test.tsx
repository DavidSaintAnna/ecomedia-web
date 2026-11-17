import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../App';

function montar(caminho = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[caminho]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status });

afterEach(() => vi.unstubAllGlobals());

describe('Início', () => {
  it('mostra os números da comunidade formatados em português', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('/api/stats')
          ? json({ users: 1234, posts: 56, comments: 7, likes: 89, categories: 6, cities: 3 })
          : json({ status: 'ok' }),
      ),
    );
    montar();

    expect(await screen.findByText('1.234')).toBeInTheDocument();
    expect(screen.getByText('Publicações')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ações sustentáveis perto de você/i })).toBeInTheDocument();
  });

  it('mostra o erro e deixa tentar de novo', async () => {
    let tentativas = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (!url.includes('/api/stats')) return json({ status: 'ok' });
        tentativas += 1;
        return tentativas === 1
          ? json({ error: 'InternalError', message: 'Erro interno do servidor' }, 500)
          : json({ users: 2, posts: 0, comments: 0, likes: 0, categories: 6, cities: 0 });
      }),
    );
    montar();

    expect(await screen.findByText('Erro interno do servidor')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Pessoas')).toBeInTheDocument();
  });
});

describe('Rota inexistente', () => {
  it('mostra a página 404', () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 'ok' })));
    montar('/nao-existe');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
