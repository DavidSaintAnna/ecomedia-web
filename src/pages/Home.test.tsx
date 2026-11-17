import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, mockApi, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

describe('Início', () => {
  it('mostra os números da comunidade formatados em português', async () => {
    mockApi({ 'GET /api/stats': () => json({ users: 1234, posts: 56, comments: 7, likes: 89, categories: 6, cities: 3 }) });
    renderApp();

    expect(await screen.findByText('1.234')).toBeInTheDocument();
    expect(screen.getByText('Publicações')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /ações sustentáveis perto de você/i })).toBeInTheDocument();
  });

  it('mostra o erro e deixa tentar de novo', async () => {
    let tentativas = 0;
    mockApi({
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
});

describe('Rota inexistente', () => {
  it('mostra a página 404', () => {
    mockApi();
    renderApp('/nao-existe');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
