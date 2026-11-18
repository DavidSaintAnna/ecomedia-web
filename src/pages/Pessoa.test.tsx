import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import type { Person, Profile } from '../api/types';
import { USUARIA, json, mockApi, post, renderApp, type Chamada } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const ANA: Profile = {
  id: 20,
  name: 'Ana Souza',
  city: 'Recife',
  bio: 'Compostagem e bicicleta.',
  avatarUrl: null,
  createdAt: '2026-03-10T15:00:00.000Z',
  postsCount: 2,
  followersCount: 3,
  followingCount: 1,
  followedByMe: false,
};

const pessoa = (id: number, name: string, city: string | null = null): Person => ({ id, name, city, avatarUrl: null });
const pagina = <T,>(todos: T[], query: URLSearchParams) => {
  const page = Number(query.get('page') ?? 1);
  const limit = Number(query.get('limit') ?? 10);
  return json({ data: todos.slice((page - 1) * limit, page * limit), meta: { page, limit, total: todos.length, totalPages: Math.max(1, Math.ceil(todos.length / limit)) } });
};

interface Opcoes {
  usuaria?: typeof USUARIA | null;
  perfil?: Profile;
  seguidores?: Person[];
  seguindo?: Person[];
  posts?: ReturnType<typeof post>[];
  seguirFalha?: boolean;
}

/** API de mentira com memória: seguir alterna e muda o perfil e a lista de seguidores. */
function servidor({ usuaria = USUARIA, perfil = ANA, seguidores, seguindo, posts, seguirFalha = false }: Opcoes = {}) {
  const estado = {
    seguido: perfil.followedByMe,
    seguidores: seguidores ?? [pessoa(31, 'Bruno Lima', 'Natal'), pessoa(32, 'Carla Dias'), pessoa(33, 'Davi Rocha')],
  };
  const doAutor = posts ?? [
    post(1, { author: { id: perfil.id, name: perfil.name, avatarUrl: null }, content: 'Primeira compostagem do bairro' }),
    post(2, { author: { id: perfil.id, name: perfil.name, avatarUrl: null }, content: 'Segunda ação sustentável' }),
  ];
  if (usuaria) tokenStore.set('abc');
  const atual = (): Profile => ({
    ...perfil,
    followedByMe: estado.seguido,
    followersCount: perfil.followersCount + (estado.seguido && !perfil.followedByMe ? 1 : !estado.seguido && perfil.followedByMe ? -1 : 0),
    postsCount: doAutor.length,
  });
  const chamadas = mockApi({
    'GET /api/auth/me': () => (usuaria ? json(usuaria) : json({ error: 'Unauthorized', message: 'Token inválido ou expirado' }, 401)),
    [`GET /api/users/${perfil.id}`]: () => json(atual()),
    [`GET /api/users/${perfil.id}/followers`]: ({ query }: Chamada) => pagina(estado.seguidores, query),
    [`GET /api/users/${perfil.id}/following`]: ({ query }: Chamada) => pagina(seguindo ?? [pessoa(40, 'Elisa Prado', 'Belém')], query),
    'GET /api/posts': ({ query }: Chamada) => pagina(query.get('authorId') === String(perfil.id) ? doAutor : [], query),
    'GET /api/categories': () => json([]),
    [`POST /api/users/${perfil.id}/follow`]: () => {
      if (seguirFalha) return json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500);
      estado.seguido = !estado.seguido;
      return json({ following: estado.seguido, followersCount: atual().followersCount });
    },
  });
  return { chamadas, estado };
}

describe('Perfil de uma pessoa', () => {
  it('mostra nome, cidade, bio, desde quando, contagens e as publicações dela', async () => {
    const { chamadas } = servidor({ usuaria: null });
    renderApp('/pessoas/20');

    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText(/Recife · Na EcoMedia desde março de 2026/)).toBeInTheDocument();
    expect(screen.getByText('Compostagem e bicicleta.')).toBeInTheDocument();
    const abas = screen.getByRole('navigation', { name: 'Seções do perfil de Ana Souza' });
    expect(within(abas).getByRole('link', { name: '2 publicações' })).toHaveAttribute('aria-current', 'page');
    expect(within(abas).getByRole('link', { name: '3 seguidores' })).toBeInTheDocument();
    expect(within(abas).getByRole('link', { name: '1 seguindo' })).toBeInTheDocument();
    expect(await screen.findByText('Primeira compostagem do bairro')).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === '/api/posts')?.query.get('authorId')).toBe('20');
  });

  it('visitante vê um link para entrar, e depois de entrar volta ao perfil', async () => {
    servidor({ usuaria: null });
    mockApi({
      'GET /api/users/20': () => json(ANA),
      'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
      'POST /api/auth/login': () => json({ user: USUARIA, token: 'novo' }),
    });
    renderApp('/pessoas/20');

    await userEvent.click(await screen.findByRole('link', { name: 'Entre para seguir' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await u.type(screen.getByLabelText('Senha'), 'Senha12345');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
  });

  it('seguir muda o botão e o número de seguidores; deixar de seguir desfaz', async () => {
    const { chamadas } = servidor();
    renderApp('/pessoas/20');

    await userEvent.click(await screen.findByRole('button', { name: 'Seguir Ana Souza' }));
    expect(await screen.findByRole('button', { name: 'Deixar de seguir Ana Souza' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '4 seguidores' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deixar de seguir Ana Souza' }));
    expect(await screen.findByRole('button', { name: 'Seguir Ana Souza' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '3 seguidores' })).toBeInTheDocument();
    expect(chamadas.filter((c) => c.method === 'POST' && c.path === '/api/users/20/follow')).toHaveLength(2);
  });

  it('o botão fica desligado enquanto a API responde (sem clique duplo)', async () => {
    servidor();
    let responder!: (r: Response) => void;
    const espera = new Promise<Response>((resolve) => (responder = resolve));
    const fetchAntigo = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => (url.endsWith('/api/users/20/follow') ? espera : fetchAntigo(url, init))));
    renderApp('/pessoas/20');

    await userEvent.click(await screen.findByRole('button', { name: 'Seguir Ana Souza' }));
    expect(screen.getByRole('button', { name: 'Deixar de seguir Ana Souza' })).toBeDisabled();
    expect(screen.getByRole('link', { name: '4 seguidores' })).toBeInTheDocument(); // na hora
    responder(json({ following: true, followersCount: 9 })); // mais gente seguiu nesse meio tempo
    expect(await screen.findByRole('link', { name: '9 seguidores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deixar de seguir Ana Souza' })).toBeEnabled();
  });

  it('se a API falhar, o botão e o número voltam ao que eram e aparece o aviso', async () => {
    servidor({ seguirFalha: true });
    renderApp('/pessoas/20');

    await userEvent.click(await screen.findByRole('button', { name: 'Seguir Ana Souza' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');
    expect(screen.getByRole('button', { name: 'Seguir Ana Souza' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '3 seguidores' })).toBeInTheDocument();
  });

  it('em quem já sigo, o botão já vem como "Deixar de seguir"', async () => {
    servidor({ perfil: { ...ANA, followedByMe: true } });
    renderApp('/pessoas/20');
    expect(await screen.findByRole('button', { name: 'Deixar de seguir Ana Souza' })).toBeInTheDocument();
  });

  it('no meu próprio perfil não há botão de seguir: só o atalho para a minha conta', async () => {
    servidor({ perfil: { ...ANA, id: 7, name: 'Maria Souza' } });
    renderApp('/pessoas/7');
    expect(await screen.findByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/conta');
    expect(screen.queryByRole('button', { name: /Seguir/ })).not.toBeInTheDocument();
  });

  it('aba Seguidores lista as pessoas, com link para o perfil de cada uma', async () => {
    servidor({ usuaria: null });
    renderApp('/pessoas/20?aba=seguidores');

    expect(await screen.findByRole('heading', { level: 2, name: 'Seguidores' })).toBeInTheDocument();
    const bruno = await screen.findByRole('link', { name: 'Bruno Lima' });
    expect(bruno).toHaveAttribute('href', '/pessoas/31');
    expect(screen.getByText('Natal')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: '3 seguidores' })).toHaveAttribute('aria-current', 'page');
  });

  it('trocar de aba pelos links mostra Seguindo e depois volta às publicações', async () => {
    servidor({ usuaria: null });
    renderApp('/pessoas/20');

    await userEvent.click(await screen.findByRole('link', { name: '1 seguindo' }));
    expect(await screen.findByRole('link', { name: 'Elisa Prado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Seguindo' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '2 publicações' }));
    expect(await screen.findByText('Primeira compostagem do bairro')).toBeInTheDocument();
  });

  it('clicar numa pessoa da lista abre o perfil dela', async () => {
    servidor({ usuaria: null });
    mockApi({
      'GET /api/users/20': () => json(ANA),
      'GET /api/users/20/followers': ({ query }) => pagina([pessoa(31, 'Bruno Lima')], query),
      'GET /api/users/31': () => json({ ...ANA, id: 31, name: 'Bruno Lima', city: null, bio: null }),
      'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    });
    renderApp('/pessoas/20?aba=seguidores');
    await userEvent.click(await screen.findByRole('link', { name: 'Bruno Lima' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Bruno Lima' })).toBeInTheDocument();
  });

  it('listas vazias explicam por quê', async () => {
    servidor({ usuaria: null, seguidores: [], seguindo: [], posts: [] });
    renderApp('/pessoas/20');
    expect(await screen.findByText('Esta pessoa ainda não publicou nada.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /seguidor/ }));
    expect(await screen.findByText('Ninguém segue esta pessoa ainda.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /seguindo/ }));
    expect(await screen.findByText('Esta pessoa ainda não segue ninguém.')).toBeInTheDocument();
  });

  it('pagina as publicações pela própria página do perfil', async () => {
    const muitos = Array.from({ length: 12 }, (_, i) => post(100 + i, { author: { id: 20, name: 'Ana Souza', avatarUrl: null }, content: `Publicação número ${i + 1} da Ana` }));
    const { chamadas } = servidor({ usuaria: null, posts: muitos });
    renderApp('/pessoas/20');

    expect(await screen.findByText('Publicação número 1 da Ana')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Próxima →' }));
    expect(await screen.findByText('Publicação número 11 da Ana')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(chamadas.some((c) => c.path === '/api/posts' && c.query.get('page') === '2' && c.query.get('authorId') === '20')).toBe(true);
  });

  it('página que não existe oferece voltar à primeira', async () => {
    servidor({ usuaria: null });
    renderApp('/pessoas/20?pagina=9');
    expect(await screen.findByText('Esta página não existe.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar à primeira página' })).toBeInTheDocument();
  });

  it('pessoa que não existe (404) mostra o aviso', async () => {
    mockApi({ 'GET /api/users/99': () => json({ error: 'NotFound', message: 'Usuário não encontrado' }, 404), 'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }) });
    renderApp('/pessoas/99');
    expect(await screen.findByRole('heading', { name: 'Pessoa não encontrada' })).toBeInTheDocument();
  });

  it('endereço com id que não é número nem chama a API de usuários', async () => {
    const chamadas = mockApi();
    renderApp('/pessoas/abc');
    expect(await screen.findByRole('heading', { name: 'Pessoa não encontrada' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.path.startsWith('/api/users/') || c.path === '/api/posts')).toBe(false);
  });

  it('erro de servidor no perfil deixa tentar de novo', async () => {
    let n = 0;
    mockApi({
      'GET /api/users/20': () => {
        n += 1;
        return n === 1 ? json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500) : json(ANA);
      },
      'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    });
    renderApp('/pessoas/20');
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
  });
});

describe('Nomes dos autores levam ao perfil', () => {
  it('no cartão do Explorar', async () => {
    mockApi({
      'GET /api/posts': ({ query }: Chamada) => (query.get('authorId') ? json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }) : json({ data: [post(5)], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } })),
      'GET /api/categories': () => json([]),
      'GET /api/users/15': () => json({ ...ANA, id: 15, name: 'Pessoa 5' }),
    });
    renderApp('/explorar');
    await userEvent.click(await screen.findByRole('link', { name: 'Pessoa 5' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Pessoa 5' })).toBeInTheDocument();
  });

  it('nos comentários', async () => {
    mockApi({
      'GET /api/posts/5': () => json(post(5, { commentsCount: 1 })),
      'GET /api/posts/5/comments': () =>
        json({ data: [{ id: 1, postId: 5, content: 'Muito bom, parabéns!', createdAt: '2026-01-05T16:00:00.000Z', editedAt: null, author: { id: 30, name: 'Carlos Lima', avatarUrl: null } }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      'GET /api/users/30': () => json({ ...ANA, id: 30, name: 'Carlos Lima' }),
      'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    });
    renderApp('/posts/5');
    await userEvent.click(await screen.findByRole('link', { name: 'Carlos Lima' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Carlos Lima' })).toBeInTheDocument();
  });
});
