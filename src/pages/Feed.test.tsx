import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import { USUARIA, json, mockApi, post, renderApp, type Chamada } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const meta = (total: number, page = 1, limit = 10) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

function comLogin(rotas: Parameters<typeof mockApi>[0]) {
  tokenStore.set('abc');
  return mockApi({ 'GET /api/auth/me': () => json(USUARIA), ...rotas });
}

describe('Feed', () => {
  it('visitante é levado para entrar', async () => {
    mockApi({ 'GET /api/auth/me': () => json({ error: 'Unauthorized', message: 'Token inválido' }, 401) });
    renderApp('/feed');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('o link Feed aparece só para quem entrou', async () => {
    comLogin({});
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Feed' })).toBeInTheDocument();
  });

  it('mostra as publicações de quem eu sigo', async () => {
    const chamadas = comLogin({ 'GET /api/feed': () => json({ data: [post(1), post(2)], meta: meta(2) }) });
    renderApp('/feed');
    expect(await screen.findByText('Ação sustentável número 1')).toBeInTheDocument();
    expect(screen.getByText('Ação sustentável número 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2 publicações' })).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === '/api/feed')?.query.get('page')).toBe('1');
  });

  it('feed vazio explica e leva ao Explorar', async () => {
    comLogin({ 'GET /api/feed': () => json({ data: [], meta: meta(0) }) });
    renderApp('/feed');
    expect(await screen.findByText(/Seu feed está vazio/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar publicações' })).toHaveAttribute('href', '/explorar');
  });

  it('pagina pelo endereço (?pagina=2)', async () => {
    const todos = Array.from({ length: 12 }, (_, i) => post(i + 1));
    const chamadas = comLogin({
      'GET /api/feed': ({ query }: Chamada) => {
        const page = Number(query.get('page'));
        return json({ data: todos.slice((page - 1) * 10, page * 10), meta: meta(12, page) });
      },
    });
    renderApp('/feed');
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Próxima →' }));
    expect(await screen.findByText('Ação sustentável número 11')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(chamadas.some((c) => c.path === '/api/feed' && c.query.get('page') === '2')).toBe(true);
  });

  it('página que não existe oferece voltar à primeira', async () => {
    comLogin({ 'GET /api/feed': () => json({ data: [], meta: meta(3, 9) }) });
    renderApp('/feed?pagina=9');
    expect(await screen.findByText(/Esta página não existe/)).toBeInTheDocument();
  });

  it('curtir no feed atualiza o cartão na hora', async () => {
    comLogin({
      'GET /api/feed': () => json({ data: [post(1, { likesCount: 2 })], meta: meta(1) }),
      'POST /api/posts/1/like': () => json({ liked: true, likesCount: 3 }),
    });
    renderApp('/feed');
    await userEvent.click(await screen.findByRole('button', { name: /Curtir/ }));
    expect(await screen.findByText('3 curtidas')).toBeInTheDocument();
  });

  it('erro de servidor deixa tentar de novo', async () => {
    let n = 0;
    comLogin({
      'GET /api/feed': () => {
        n += 1;
        return n === 1 ? json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500) : json({ data: [post(1)], meta: meta(1) });
      },
    });
    renderApp('/feed');
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Ação sustentável número 1')).toBeInTheDocument();
  });
});
