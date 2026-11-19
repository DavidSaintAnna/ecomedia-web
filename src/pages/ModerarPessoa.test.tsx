import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import type { Profile } from '../api/types';
import { USUARIA, json, mockApi, post, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const ADMIN = { ...USUARIA, id: 1, name: 'Administrador EcoMedia', role: 'ADMIN' };
const ANA: Profile = { id: 20, name: 'Ana Souza', city: 'Recife', bio: null, avatarUrl: null, createdAt: '2026-03-10T15:00:00.000Z', postsCount: 2, followersCount: 0, followingCount: 0, followedByMe: false };
const VAZIO = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } };

function servidor({ usuaria = ADMIN as typeof USUARIA | null, perfil = ANA, excluir = (() => new Response(null, { status: 204 })) as () => Response } = {}) {
  if (usuaria) tokenStore.set('abc');
  let existe = true;
  return mockApi({
    'GET /api/auth/me': () => (usuaria ? json(usuaria) : json({ error: 'Unauthorized', message: 'Token inválido' }, 401)),
    [`GET /api/users/${perfil.id}`]: () => (existe ? json(perfil) : json({ error: 'NotFound', message: 'Usuário não encontrado' }, 404)),
    'GET /api/posts': () => json(perfil.id === ANA.id ? { data: [post(1)], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } } : VAZIO),
    'GET /api/categories': () => json([]),
    [`DELETE /api/users/${perfil.id}`]: () => {
      const r = excluir();
      if (r.status === 204) existe = false;
      return r;
    },
  });
}

describe('Administrador exclui a conta de outra pessoa', () => {
  it('pede confirmação, exclui, volta para Explorar e avisa', async () => {
    const chamadas = servidor();
    renderApp('/pessoas/20');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir esta conta de Ana Souza' }));
    expect(screen.getByRole('group', { name: 'Confirmar exclusão da conta de Ana Souza' })).toHaveTextContent('As 2 publicações de Ana Souza serão apagadas');
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir a conta' }));
    expect(await screen.findByRole('heading', { name: 'Explorar publicações' })).toBeInTheDocument();
    expect(await screen.findByText('A conta de Ana Souza foi excluída.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'DELETE')?.path).toBe('/api/users/20');
    expect(chamadas.find((c) => c.method === 'DELETE')?.headers.Authorization).toBe('Bearer abc');
  });

  it('"Cancelar" desiste sem chamar a API', async () => {
    const chamadas = servidor();
    renderApp('/pessoas/20');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir esta conta de Ana Souza' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('group', { name: /Confirmar exclusão/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir esta conta de Ana Souza' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('se a API recusar (por exemplo, a conta é de outro administrador), mostra a mensagem e continua na página', async () => {
    servidor({ excluir: () => json({ error: 'Forbidden', message: 'A conta de outro administrador não pode ser excluída por aqui' }, 403) });
    renderApp('/pessoas/20');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir esta conta de Ana Souza' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir a conta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A conta de outro administrador não pode ser excluída por aqui');
    expect(screen.getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
  });

  it.each([
    [0, 'Os comentários e as curtidas de Ana Souza serão apagados'],
    [1, 'A publicação de Ana Souza será apagada'],
    [3, 'As 3 publicações de Ana Souza serão apagadas'],
  ])('o texto da confirmação concorda com o número de publicações (%i)', async (quantas, texto) => {
    servidor({ perfil: { ...ANA, postsCount: quantas } });
    renderApp('/pessoas/20');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir esta conta de Ana Souza' }));
    expect(screen.getByRole('group', { name: /Confirmar exclusão/ })).toHaveTextContent(texto);
  });

  it('pessoa comum não vê a moderação', async () => {
    servidor({ usuaria: USUARIA });
    renderApp('/pessoas/20');
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });
    expect(screen.queryByRole('heading', { name: 'Moderação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir a conta/ })).not.toBeInTheDocument();
  });

  it('visitante não vê a moderação', async () => {
    servidor({ usuaria: null });
    renderApp('/pessoas/20');
    await screen.findByRole('heading', { level: 1, name: 'Ana Souza' });
    expect(screen.queryByRole('heading', { name: 'Moderação' })).not.toBeInTheDocument();
  });

  it('no próprio perfil o administrador não vê a moderação (a exclusão fica em Minha conta)', async () => {
    servidor({ perfil: { ...ANA, id: 1, name: 'Administrador EcoMedia' } });
    renderApp('/pessoas/1');
    await screen.findByRole('heading', { level: 1, name: 'Administrador EcoMedia' });
    expect(screen.queryByRole('heading', { name: 'Moderação' })).not.toBeInTheDocument();
  });
});
