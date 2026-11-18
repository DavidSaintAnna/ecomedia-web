import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import { ErroDeImagem, FOTO_DE_PERFIL, FOTO_DE_PUBLICACAO } from '../lib/imagem';
import { USUARIA, categoriasMock, json, mockApi, post, renderApp } from '../test/utils';

// O navegador de teste (jsdom) não tem canvas; a redução em si é testada à parte (calcularRecorte).
// Uma função comum (e não vi.fn): o vitest trata erros lançados por vi.fn como falha do teste, mesmo quando o código os captura.
const reducao = vi.hoisted(() => ({
  chamadas: [] as { arquivo: File; opcoes: unknown }[],
  fazer: (async () => new Blob()) as () => Promise<Blob>,
}));
vi.mock('../lib/imagem', async (original) => ({
  ...(await original<typeof import('../lib/imagem')>()),
  reduzirImagem: async (arquivo: File, opcoes: unknown) => {
    reducao.chamadas.push({ arquivo, opcoes });
    return reducao.fazer();
  },
}));
const reduzirComo = (fazer: () => Promise<Blob>) => void (reducao.fazer = fazer);

const FOTO_ENVIADA = 'http://localhost:3333/api/images/42';
const arquivo = () => new File(['bytes-da-foto'], 'minha-foto.png', { type: 'image/png' });
const pequena = () => new Blob(['bytes-pequenos'], { type: 'image/webp' });

beforeEach(() => {
  reducao.chamadas.length = 0;
});
afterEach(() => vi.unstubAllGlobals());

type Usuaria = Omit<typeof USUARIA, 'avatarUrl'> & { avatarUrl: string | null };

function perfilDe(u: Usuaria) {
  return { id: u.id, name: u.name, city: u.city, bio: u.bio, avatarUrl: u.avatarUrl, createdAt: u.createdAt, postsCount: 0, followersCount: 0, followingCount: 0, followedByMe: false };
}

/** API de mentira com memória do perfil e das fotos enviadas. */
function servidor(usuaria: Usuaria = USUARIA, extras: Parameters<typeof mockApi>[0] = {}) {
  const atual = { ...usuaria };
  tokenStore.set('abc');
  const chamadas = mockApi({
    'GET /api/auth/me': () => json(atual),
    'GET /api/categories': () => json(categoriasMock),
    'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    'POST /api/images': () => json({ id: 42, contentType: 'image/webp', size: 14, url: FOTO_ENVIADA }, 201),
    'PATCH /api/users/me': ({ body }) => {
      Object.assign(atual, body);
      return json(perfilDe(atual));
    },
    'POST /api/posts': ({ body }) => json(post(100, { ...(body as object), imageUrl: (body as { imageUrl?: string }).imageUrl ?? null }), 201),
    ...extras,
  });
  return chamadas;
}

const escolher = (rotulo = 'Escolher foto do computador') => userEvent.upload(screen.getByLabelText(rotulo), arquivo());

describe('Foto de perfil enviada do computador', () => {
  it('reduz como foto de perfil, envia os bytes, mostra a prévia e salva o link', async () => {
    reduzirComo(async () => pequena());
    const chamadas = servidor();
    renderApp('/conta');
    await screen.findByLabelText('Nome');
    await escolher();

    expect(await screen.findByAltText('Prévia da foto escolhida')).toHaveAttribute('src', FOTO_ENVIADA);
    expect(reducao.chamadas).toEqual([{ arquivo: expect.any(File), opcoes: FOTO_DE_PERFIL }]);
    const envio = chamadas.find((c) => c.path === '/api/images')!;
    expect(envio.method).toBe('POST');
    expect(envio.headers['Content-Type']).toBe('image/webp');
    expect(envio.headers.Authorization).toBe('Bearer abc');
    expect(envio.body).toBeInstanceOf(Blob);
    // o link da foto enviada não vira um campo de texto
    expect(screen.queryByLabelText('Link da sua foto (opcional)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument();
    expect(screen.getByText('Trocar foto')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ avatarUrl: FOTO_ENVIADA });
  });

  it('remover a foto volta ao campo do link e salva null', async () => {
    reduzirComo(async () => pequena());
    const chamadas = servidor({ ...USUARIA, avatarUrl: FOTO_ENVIADA });
    renderApp('/conta');
    expect(await screen.findByAltText('Prévia da foto escolhida')).toBeInTheDocument(); // foto que já estava no perfil

    await userEvent.click(screen.getByRole('button', { name: 'Remover foto' }));
    expect(screen.queryByAltText('Prévia da foto escolhida')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Link da sua foto (opcional)')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ avatarUrl: null });
  });

  it('um link de outro site continua funcionando como antes, sem prévia', async () => {
    servidor();
    renderApp('/conta');
    await userEvent.type(await screen.findByLabelText('Link da sua foto (opcional)'), 'https://outro.com/foto.png');
    expect(screen.queryByAltText('Prévia da foto escolhida')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument();
    expect(screen.getByText('Escolher foto do computador')).toBeInTheDocument();
  });

  it('arquivo que não é imagem: mostra o motivo e não chama a API', async () => {
    reduzirComo(async () => {
      throw new ErroDeImagem('Esse arquivo não é uma foto. Escolha uma imagem PNG, JPEG ou WebP.');
    });
    const chamadas = servidor();
    renderApp('/conta');
    await screen.findByLabelText('Nome');
    await escolher();
    expect(await screen.findByRole('alert')).toHaveTextContent('Esse arquivo não é uma foto');
    expect(chamadas.some((c) => c.path === '/api/images')).toBe(false);
    expect(screen.getByLabelText('Link da sua foto (opcional)')).toBeInTheDocument(); // ainda dá para usar um link
  });

  it('erro da API no envio (imagem grande, limite de fotos) aparece com a mensagem dela', async () => {
    reduzirComo(async () => pequena());
    servidor(USUARIA, {
      'POST /api/images': () => json({ error: 'Conflict', message: 'Você chegou ao limite de 20 imagens. Exclua publicações antigas com foto ou troque a foto do perfil e tente de novo' }, 409),
    });
    renderApp('/conta');
    await screen.findByLabelText('Nome');
    await escolher();
    expect(await screen.findByRole('alert')).toHaveTextContent('limite de 20 imagens');
    expect(screen.queryByAltText('Prévia da foto escolhida')).not.toBeInTheDocument();
  });

  it('enquanto a foto sobe, não deixa salvar o perfil e avisa', async () => {
    let terminar!: () => void;
    reduzirComo(() => new Promise<Blob>((resolve) => (terminar = () => resolve(pequena()))));
    servidor();
    renderApp('/conta');
    await screen.findByLabelText('Nome');
    await escolher();

    expect(await screen.findByText('Enviando a foto, um instante…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
    terminar();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled());
  });
});

describe('Imagem de publicação enviada do computador', () => {
  it('reduz como foto de publicação e publica com o link da imagem enviada', async () => {
    reduzirComo(async () => pequena());
    const chamadas = servidor();
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Reciclagem' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Reciclagem');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'Separei todo o lixo da semana');
    await escolher();
    expect(await screen.findByAltText('Prévia da foto escolhida')).toHaveAttribute('src', FOTO_ENVIADA);
    expect(reducao.chamadas).toEqual([{ arquivo: expect.any(File), opcoes: FOTO_DE_PUBLICACAO }]);

    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(chamadas.some((c) => c.method === 'POST' && c.path === '/api/posts')).toBe(true));
    expect(chamadas.find((c) => c.method === 'POST' && c.path === '/api/posts')?.body).toMatchObject({ imageUrl: FOTO_ENVIADA });
  });

  it('enquanto a imagem sobe, o botão de publicar fica desativado', async () => {
    let terminar!: () => void;
    reduzirComo(() => new Promise<Blob>((resolve) => (terminar = () => resolve(pequena()))));
    servidor();
    renderApp('/posts/novo');
    await screen.findByLabelText('Categoria');
    await escolher();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled());
    terminar();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled());
  });

  it('ao editar uma publicação com imagem enviada, mostra a prévia e dá para remover', async () => {
    reduzirComo(async () => pequena());
    const minha = post(5, { author: { id: 7, name: 'Maria Souza', avatarUrl: null }, imageUrl: FOTO_ENVIADA });
    const chamadas = servidor(USUARIA, {
      'GET /api/posts/5': () => json(minha),
      'PATCH /api/posts/5': ({ body }) => json({ ...minha, ...(body as object) }),
    });
    renderApp('/posts/5/editar');
    expect(await screen.findByAltText('Prévia da foto escolhida')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remover foto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(chamadas.some((c) => c.method === 'PATCH')).toBe(true));
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ imageUrl: null });
  });
});
