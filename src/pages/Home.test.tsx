import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import { USUARIA, json, mockApi, post, renderApp, responderPosts } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const STATS = { users: 2, posts: 3, comments: 0, likes: 0, categories: 2, cities: 1 };
const CATEGORIAS = [
  { id: 1, name: 'Reciclagem', description: 'Separação e reaproveitamento' },
  { id: 3, name: 'Água', description: null },
];

/** API de mentira com tudo o que a página inicial pede; cada teste troca só o que quer testar. */
function apiDaHome(extra: Parameters<typeof mockApi>[0] = {}) {
  return mockApi({
    'GET /api/stats': () => json(STATS),
    'GET /api/categories': () => json(CATEGORIAS),
    'GET /api/posts': responderPosts([post(1), post(2), post(3)]),
    ...extra,
  });
}

describe('Início: abertura e números', () => {
  it('mostra os números da comunidade formatados em português', async () => {
    apiDaHome({ 'GET /api/stats': () => json({ users: 1234, posts: 56, comments: 7, likes: 89, categories: 6, cities: 3 }) });
    renderApp();

    expect(await screen.findByText('1.234')).toBeInTheDocument();
    expect(screen.getByText('Publicações')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ações sustentáveis perto de você/i })).toBeInTheDocument();
  });

  it('mostra o erro dos números e deixa tentar de novo', async () => {
    let tentativas = 0;
    apiDaHome({
      'GET /api/stats': () => {
        tentativas += 1;
        return tentativas === 1
          ? json({ error: 'InternalError', message: 'Erro interno do servidor' }, 500)
          : json({ users: 2, posts: 0, comments: 0, likes: 0, categories: 6, cities: 0 });
      },
    });
    renderApp();

    expect(await screen.findByText('Erro interno do servidor')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Pessoas')).toBeInTheDocument();
  });

  it('visitante vê os convites para criar conta e para explorar', async () => {
    apiDaHome();
    renderApp();

    const abertura = screen.getByRole('heading', { level: 1 }).closest('section')!;
    expect(within(abertura).getByRole('link', { name: 'Explorar publicações' })).toHaveAttribute('href', '/explorar');
    expect(await within(abertura).findByRole('link', { name: 'Criar minha conta' })).toHaveAttribute('href', '/cadastro');

    const faixa = (await screen.findByRole('heading', { name: 'Tem uma ação sustentável para contar?' })).closest('section')!;
    expect(within(faixa).getByRole('link', { name: 'Criar minha conta' })).toHaveAttribute('href', '/cadastro');
    expect(within(faixa).getByRole('link', { name: 'Já tenho conta' })).toHaveAttribute('href', '/entrar');

    // o botão do topo da página continua sendo o único "Criar conta"
    expect(screen.getAllByRole('link', { name: 'Criar conta' })).toHaveLength(1);
  });

  it('quem já entrou vê o convite para publicar, não para criar conta', async () => {
    tokenStore.set('abc');
    apiDaHome({ 'GET /api/auth/me': () => json(USUARIA) });
    renderApp();

    const abertura = screen.getByRole('heading', { level: 1 }).closest('section')!;
    expect(await within(abertura).findByRole('link', { name: 'Publicar uma ação' })).toHaveAttribute('href', '/posts/novo');
    expect(within(abertura).queryByRole('link', { name: 'Criar minha conta' })).not.toBeInTheDocument();

    const faixa = (await screen.findByRole('heading', { name: 'Fez algo bom pela cidade?' })).closest('section')!;
    expect(within(faixa).getByRole('link', { name: 'Publicar minha ação' })).toHaveAttribute('href', '/posts/novo');
    expect(screen.queryByRole('link', { name: 'Já tenho conta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Criar (minha )?conta/ })).not.toBeInTheDocument();

    // o botão do topo da página continua sendo o único "Publicar"
    expect(screen.getAllByRole('link', { name: 'Publicar' })).toHaveLength(1);
  });
});

describe('Início: categorias', () => {
  it('cada categoria leva para Explorar já filtrado, e há um atalho para ver tudo', async () => {
    apiDaHome();
    renderApp();

    expect(await screen.findByRole('link', { name: 'Reciclagem' })).toHaveAttribute('href', '/explorar?categoryId=1');
    expect(screen.getByRole('link', { name: 'Água' })).toHaveAttribute('href', '/explorar?categoryId=3');
    expect(screen.getByRole('link', { name: 'Ver todas as publicações' })).toHaveAttribute('href', '/explorar');
    expect(screen.getByText('Separação e reaproveitamento')).toBeInTheDocument();
  });

  it('os desenhos das categorias são enfeite: não aparecem para leitores de tela', async () => {
    apiDaHome();
    renderApp();
    const link = await screen.findByRole('link', { name: 'Reciclagem' });
    const bloco = link.closest('li')!;
    expect(bloco.querySelectorAll('svg').length).toBeGreaterThan(0);
    for (const svg of bloco.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('mostra o erro das categorias e deixa tentar de novo', async () => {
    let tentativas = 0;
    apiDaHome({
      'GET /api/categories': () => {
        tentativas += 1;
        return tentativas === 1 ? json({ error: 'InternalError', message: 'Categorias fora do ar' }, 500) : json(CATEGORIAS);
      },
    });
    renderApp();

    expect(await screen.findByText('Categorias fora do ar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar carregar as categorias de novo' }));
    expect(await screen.findByRole('link', { name: 'Reciclagem' })).toBeInTheDocument();
  });
});

describe('Início: publicações mais recentes', () => {
  it('mostra as publicações em slides numerados, com link para cada uma', async () => {
    const chamadas = apiDaHome();
    renderApp();

    const slides = await screen.findAllByRole('group', { name: /^\d+ de \d+$/ });
    expect(slides.map((s) => s.getAttribute('aria-label'))).toEqual(['1 de 3', '2 de 3', '3 de 3']);
    expect(slides[0]).toHaveAttribute('aria-roledescription', 'slide');
    expect(within(slides[0]).getByText('Ação sustentável número 1')).toBeInTheDocument();
    expect(within(slides[0]).getByText('Reciclagem')).toBeInTheDocument();
    expect(within(slides[0]).getByRole('link', { name: 'Ler a publicação de Pessoa 1' })).toHaveAttribute('href', '/posts/1');

    const pedido = chamadas.find((c) => c.path === '/api/posts');
    expect(pedido?.query.get('limit')).toBe('8');
    expect(pedido?.query.get('page')).toBe('1');
  });

  it('o carrossel é uma região com nome e papel de carrossel', async () => {
    apiDaHome();
    renderApp();
    // enquanto carrega existe uma região com o mesmo nome (o esqueleto): espera os slides chegarem
    await screen.findAllByRole('group', { name: /^\d+ de \d+$/ });
    const regiao = screen.getByRole('region', { name: 'Publicações mais recentes' });
    expect(regiao).toHaveAttribute('aria-roledescription', 'carrossel');
  });

  it('sem publicações, convida a pessoa a ser a primeira', async () => {
    apiDaHome({ 'GET /api/posts': responderPosts([]) });
    renderApp();
    const vazio = (await screen.findByText(/Ainda não há publicações/)).closest('div')!;
    expect(within(vazio).getByRole('link', { name: 'Criar minha conta' })).toHaveAttribute('href', '/cadastro');
    expect(screen.queryByRole('group', { name: /de \d+$/ })).not.toBeInTheDocument();
  });

  it('mostra o erro das publicações e deixa tentar de novo', async () => {
    let tentativas = 0;
    apiDaHome({
      'GET /api/posts': (c) => {
        tentativas += 1;
        return tentativas === 1 ? json({ error: 'InternalError', message: 'Publicações fora do ar' }, 500) : responderPosts([post(1)])(c);
      },
    });
    renderApp();

    expect(await screen.findByText('Publicações fora do ar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar carregar as publicações de novo' }));
    expect(await screen.findByRole('group', { name: '1 de 1' })).toBeInTheDocument();
  });
});

describe('Rota inexistente', () => {
  it('mostra a página 404', () => {
    mockApi();
    renderApp('/nao-existe');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
