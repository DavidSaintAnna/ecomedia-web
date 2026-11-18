import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import { USUARIA, json, mockApi, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const COM_TUDO = { ...USUARIA, bio: 'Gosto de plantas', avatarUrl: null };

function perfilDe(u: typeof COM_TUDO, extra: object = {}) {
  return { id: u.id, name: u.name, city: u.city, bio: u.bio, avatarUrl: u.avatarUrl, createdAt: u.createdAt, postsCount: 0, followersCount: 0, followingCount: 0, followedByMe: false, ...extra };
}

/** API de mentira com memória do perfil: PATCH /api/users/me muda os dados. */
function servidor(usuaria = COM_TUDO, extras: Parameters<typeof mockApi>[0] = {}) {
  const atual = { ...usuaria };
  tokenStore.set('abc');
  const chamadas = mockApi({
    'GET /api/auth/me': () => json(atual),
    'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    'PATCH /api/users/me': ({ body }) => {
      Object.assign(atual, body);
      return json(perfilDe(atual));
    },
    ...extras,
  });
  return { chamadas, atual };
}

describe('Minha conta', () => {
  it('mostra os dados e o link para o perfil público', async () => {
    servidor();
    renderApp('/conta');
    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByText('maria@exemplo.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver meu perfil público' })).toHaveAttribute('href', '/pessoas/7');
    expect(screen.getByLabelText('Nome')).toHaveValue('Maria Souza');
    expect(screen.getByLabelText('Sobre você (opcional)')).toHaveValue('Gosto de plantas');
  });

  it('visitante é levado para entrar', async () => {
    mockApi({ 'GET /api/auth/me': () => json({ error: 'Unauthorized', message: 'Token inválido' }, 401) });
    renderApp('/conta');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });
});

describe('Editar perfil', () => {
  it('manda só o que mudou, mostra o aviso e atualiza o nome no menu', async () => {
    const { chamadas } = servidor();
    renderApp('/conta');
    const nome = await screen.findByLabelText('Nome');
    await userEvent.clear(nome);
    await userEvent.type(nome, '  Mariana Souza  ');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ name: 'Mariana Souza' });
    expect(screen.getByRole('link', { name: 'Mariana' })).toBeInTheDocument(); // menu
    expect(screen.getByLabelText('Nome')).toHaveValue('Mariana Souza');
  });

  it('apagar cidade e apresentação manda null', async () => {
    const { chamadas } = servidor();
    renderApp('/conta');
    await userEvent.clear(await screen.findByLabelText('Cidade (opcional)'));
    await userEvent.clear(screen.getByLabelText('Sobre você (opcional)'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ city: null, bio: null });
    expect(screen.getByText('Não informada')).toBeInTheDocument();
  });

  it('sem mudanças avisa e não chama a API', async () => {
    const { chamadas } = servidor();
    renderApp('/conta');
    await userEvent.click(await screen.findByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Você não alterou nada.');
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('campos inválidos são marcados, o foco vai ao primeiro e nada é enviado', async () => {
    const { chamadas } = servidor();
    renderApp('/conta');
    const nome = await screen.findByLabelText('Nome');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'a');
    await userEvent.type(screen.getByLabelText('Link da sua foto (opcional)'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByText('Informe seu nome (pelo menos 2 letras).')).toBeInTheDocument();
    expect(screen.getByText(/Digite um link válido/)).toBeInTheDocument();
    expect(nome).toHaveAttribute('aria-invalid', 'true');
    expect(nome).toHaveFocus();
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('erro de campo devolvido pela API aparece no campo certo', async () => {
    servidor(COM_TUDO, {
      'PATCH /api/users/me': () =>
        json({ error: 'ValidationError', message: 'Dados da requisição inválidos', details: [{ path: 'avatarUrl', message: 'Foto inválida' }] }, 400),
    });
    renderApp('/conta');
    await userEvent.type(await screen.findByLabelText('Link da sua foto (opcional)'), 'https://x.com/f.png');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Foto inválida')).toBeInTheDocument();
    expect(screen.getByLabelText('Link da sua foto (opcional)')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Excluir conta', () => {
  it('pede confirmação, exclui, volta ao início já deslogada e mostra o aviso', async () => {
    const { chamadas } = servidor(COM_TUDO, { 'DELETE /api/users/me': () => new Response(null, { status: 204 }) });
    renderApp('/conta');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir minha conta' }));
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir minha conta' }));

    expect(await screen.findByText('Sua conta foi excluída. Sentiremos sua falta!')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Criar conta' })).toBeInTheDocument(); // saiu
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(chamadas.filter((c) => c.method === 'DELETE')).toHaveLength(1);
  });

  it('cancelar não exclui', async () => {
    const { chamadas } = servidor();
    renderApp('/conta');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir minha conta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Excluir minha conta' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('o único administrador recebe o aviso da API e continua logado', async () => {
    servidor({ ...COM_TUDO, role: 'ADMIN' }, {
      'DELETE /api/users/me': () => json({ error: 'Conflict', message: 'Você é o único administrador, então a sua conta não pode ser excluída' }, 409),
    });
    renderApp('/conta');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir minha conta' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir minha conta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('único administrador');
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});
