import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RankingItem } from '../api/types';
import { json, mockApi, renderApp, type Chamada } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const item = (rank: number, name: string, likesReceived: number, postsCount: number, city: string | null = null): RankingItem => ({
  rank,
  id: 100 + rank,
  name,
  city,
  avatarUrl: null,
  postsCount,
  likesReceived,
});

const TODOS = [item(1, 'Ana Souza', 12, 3, 'Recife'), item(2, 'Bruno Lima', 7, 2, 'Natal'), item(3, 'Carla Dias', 1, 1)];

describe('Ranking', () => {
  it('lista da primeira à última posição, com curtidas, publicações e link para o perfil', async () => {
    const chamadas = mockApi({ 'GET /api/leaderboard': () => json(TODOS) });
    renderApp('/ranking');

    const itens = await screen.findAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(within(itens[0]).getByText('1º')).toBeInTheDocument();
    expect(within(itens[0]).getByRole('link', { name: 'Ana Souza' })).toHaveAttribute('href', '/pessoas/101');
    expect(within(itens[0]).getByText('12 curtidas')).toBeInTheDocument();
    expect(within(itens[0]).getByText('3 publicações')).toBeInTheDocument();
    expect(within(itens[2]).getByText('1 curtida')).toBeInTheDocument();
    expect(within(itens[2]).getByText('1 publicação')).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === '/api/leaderboard')?.query.get('limit')).toBe('10');
    expect(chamadas.find((c) => c.path === '/api/leaderboard')?.query.has('city')).toBe(false);
  });

  it('é público: não exige login', async () => {
    mockApi({ 'GET /api/leaderboard': () => json(TODOS) });
    renderApp('/ranking');
    expect(await screen.findByRole('link', { name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ranking' })).toBeInTheDocument();
  });

  it('filtra por cidade e guarda o filtro no endereço', async () => {
    const chamadas = mockApi({
      'GET /api/leaderboard': ({ query }: Chamada) => json(query.get('city') ? [TODOS[0]] : TODOS),
    });
    renderApp('/ranking');
    await screen.findByRole('link', { name: 'Bruno Lima' });

    await userEvent.type(screen.getByLabelText('Cidade'), 'Recife');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Melhores de Recife' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bruno Lima' })).not.toBeInTheDocument();
    expect(chamadas.some((c) => c.path === '/api/leaderboard' && c.query.get('city') === 'Recife')).toBe(true);
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('muda quantas pessoas aparecem', async () => {
    const chamadas = mockApi({ 'GET /api/leaderboard': () => json(TODOS) });
    renderApp('/ranking');
    await screen.findByRole('link', { name: 'Ana Souza' });
    await userEvent.selectOptions(screen.getByLabelText('Quantas pessoas'), '25');
    await screen.findByRole('link', { name: 'Ana Souza' });
    expect(chamadas.some((c) => c.path === '/api/leaderboard' && c.query.get('limit') === '25')).toBe(true);
  });

  it('valor estranho no endereço vira o padrão', async () => {
    const chamadas = mockApi({ 'GET /api/leaderboard': () => json(TODOS) });
    renderApp('/ranking?quantos=9999');
    await screen.findByRole('link', { name: 'Ana Souza' });
    expect(chamadas.find((c) => c.path === '/api/leaderboard')?.query.get('limit')).toBe('10');
  });

  it('sem ninguém, explica (com e sem filtro de cidade)', async () => {
    mockApi({ 'GET /api/leaderboard': () => json([]) });
    renderApp('/ranking?cidade=Sobral');
    expect(await screen.findByText(/Ninguém dessa cidade publicou ainda/)).toBeInTheDocument();
  });

  it('ranking vazio sem filtro', async () => {
    mockApi({ 'GET /api/leaderboard': () => json([]) });
    renderApp('/ranking');
    expect(await screen.findByText(/Ainda não há ninguém no ranking/)).toBeInTheDocument();
  });

  it('erro de servidor deixa tentar de novo', async () => {
    let n = 0;
    mockApi({
      'GET /api/leaderboard': () => {
        n += 1;
        return n === 1 ? json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500) : json(TODOS);
      },
    });
    renderApp('/ranking');
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Ana Souza' })).toBeInTheDocument();
  });
});
