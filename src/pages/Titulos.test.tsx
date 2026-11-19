import { screen } from '@testing-library/react';
import { tokenStore } from '../api/token';
import { USUARIA, json, mockApi, post, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const SEM_POSTS = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } };

describe('Título da aba do navegador', () => {
  it('acompanha o título de cada tela', async () => {
    mockApi({ 'GET /api/posts': () => json(SEM_POSTS), 'GET /api/categories': () => json([]), 'GET /api/leaderboard': () => json([]) });
    renderApp('/explorar');
    await screen.findByRole('heading', { name: 'Explorar publicações' });
    expect(document.title).toBe('Explorar publicações · EcoMedia');
  });

  it('o ranking também tem o seu título', async () => {
    mockApi({ 'GET /api/leaderboard': () => json([]) });
    renderApp('/ranking');
    await screen.findAllByRole('heading', { name: 'Ranking da comunidade' });
    expect(document.title).toBe('Ranking da comunidade · EcoMedia');
  });

  it('página inexistente: título e conteúdo de "não encontrada"', async () => {
    mockApi();
    renderApp('/isso-nao-existe');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
    expect(document.title).toBe('Página não encontrada · EcoMedia');
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Explorar publicações' })).toHaveAttribute('href', '/explorar');
  });

  it('a página de uma publicação tem um título com o nome de quem publicou', async () => {
    mockApi({ 'GET /api/posts/5': () => json(post(5, { author: { id: 9, name: 'Joana Lima', avatarUrl: null } })), 'GET /api/posts/5/comments': () => json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }) });
    renderApp('/posts/5');
    expect(await screen.findByRole('heading', { level: 1, name: 'Publicação de Joana Lima' })).toBeInTheDocument();
    expect(document.title).toBe('Publicação de Joana Lima · EcoMedia');
  });

  it('o nome da pessoa vira o título do perfil dela', async () => {
    tokenStore.set('abc');
    mockApi({
      'GET /api/auth/me': () => json(USUARIA),
      'GET /api/users/7': () => json({ id: 7, name: 'Maria Souza', city: 'Fortaleza', bio: null, avatarUrl: null, createdAt: USUARIA.createdAt, postsCount: 0, followersCount: 0, followingCount: 0, followedByMe: false }),
      'GET /api/posts': () => json(SEM_POSTS),
    });
    renderApp('/pessoas/7');
    expect(await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })).toBeInTheDocument();
    expect(document.title).toBe('Maria Souza · EcoMedia');
  });
});
