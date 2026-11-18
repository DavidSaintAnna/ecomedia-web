import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import type { Post } from '../api/types';
import { USUARIA, categoriasMock, json, mockApi, post, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const ADMIN = { ...USUARIA, id: 1, name: 'Admin EcoMedia', role: 'ADMIN' };
const SEM_COMENTARIOS = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } };
const MINHA = { id: 7, name: 'Maria Souza', avatarUrl: null };

interface Opcoes {
  usuaria?: typeof USUARIA | null;
  posts?: Post[];
  categoriasFalham?: number; // quantas vezes GET /api/categories dá erro antes de funcionar
}

/** Uma API de mentira com memória: criar, editar e excluir mudam a lista que o Explorar mostra depois. */
function servidor({ usuaria = USUARIA, posts, categoriasFalham = 0 }: Opcoes = {}) {
  const banco: Post[] = posts ?? [post(5, { author: MINHA, content: 'Minha horta', city: 'Fortaleza', imageUrl: 'https://x.com/a.jpg' }), post(6)];
  let proximoId = 100;
  let falhas = categoriasFalham;
  if (usuaria) tokenStore.set('abc');

  const achar = (path: string) => banco.find((p) => `/api/posts/${p.id}` === path);

  const chamadas = mockApi({
    'GET /api/auth/me': () => (usuaria ? json(usuaria) : json({ error: 'Unauthorized', message: 'Token inválido ou expirado' }, 401)),
    'GET /api/categories': () => {
      if (falhas > 0) {
        falhas -= 1;
        return json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500);
      }
      return json(categoriasMock);
    },
    'GET /api/posts': ({ query }) => {
      const page = Number(query.get('page') ?? 1);
      const limit = Number(query.get('limit') ?? 10);
      return json({ data: banco.slice((page - 1) * limit, page * limit), meta: { page, limit, total: banco.length, totalPages: 1 } });
    },
    'POST /api/posts': ({ body }) => {
      const b = body as { categoryId: number; content: string; imageUrl?: string; city?: string };
      const categoria = categoriasMock.find((c) => c.id === b.categoryId)!;
      const novo = post(proximoId++, {
        content: b.content,
        imageUrl: b.imageUrl ?? null,
        city: b.city ?? usuaria?.city ?? null,
        category: { id: categoria.id, name: categoria.name },
        author: { id: usuaria!.id, name: usuaria!.name, avatarUrl: null },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      banco.unshift(novo);
      return json(novo, 201);
    },
  });

  // rotas por post (o mockApi casa caminho exato, então registramos uma por post conhecido e por novos ids)
  const original = globalThis.fetch as unknown as (url: string, init?: RequestInit) => Promise<Response>;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string, init?: RequestInit) => {
      const url = new URL(entrada);
      const metodo = init?.method ?? 'GET';
      const alvo = /^\/api\/posts\/\d+$/.test(url.pathname) ? achar(url.pathname) : undefined;
      if (/^\/api\/posts\/\d+$/.test(url.pathname)) {
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        if (metodo === 'GET' || metodo === 'PATCH' || metodo === 'DELETE') chamadas.push({ method: metodo, path: url.pathname, query: url.searchParams, body, headers: {} });
        if (!alvo) return json({ error: 'NotFound', message: 'Post não encontrado' }, 404);
        if (metodo === 'GET') return json(alvo);
        const pode = usuaria && (usuaria.role === 'ADMIN' || usuaria.id === alvo.author.id);
        if (!pode) return json({ error: 'Forbidden', message: 'Você só pode alterar os seus próprios posts' }, 403);
        if (metodo === 'PATCH') {
          if (body.categoryId) alvo.category = { id: body.categoryId, name: categoriasMock.find((c) => c.id === body.categoryId)!.name };
          if (body.content !== undefined) alvo.content = body.content;
          if ('imageUrl' in body) alvo.imageUrl = body.imageUrl;
          if ('city' in body) alvo.city = body.city;
          alvo.updatedAt = new Date().toISOString();
          return json(alvo);
        }
        if (metodo === 'DELETE') {
          banco.splice(banco.indexOf(alvo), 1);
          return new Response(null, { status: 204 });
        }
      }
      if (/^\/api\/posts\/\d+\/comments$/.test(url.pathname)) return json(SEM_COMENTARIOS);
      return original(entrada, init);
    }),
  );
  return { chamadas, banco };
}

describe('Publicar', () => {
  it('visitante é levado para entrar', async () => {
    servidor({ usuaria: null });
    renderApp('/posts/novo');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('o link "Publicar" aparece só para quem entrou', async () => {
    servidor();
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Publicar' })).toBeInTheDocument();
  });

  it('publica só com categoria e texto, sem mandar campos vazios, e abre a nova publicação', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/novo');

    await screen.findByRole('option', { name: 'Água' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Hortas comunitárias');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), '  Mutirão da horta no sábado  ');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByRole('link', { name: '← Voltar para Explorar' })).toBeInTheDocument();
    expect(screen.getByText('Mutirão da horta no sábado')).toBeInTheDocument();
    const envio = chamadas.find((c) => c.method === 'POST' && c.path === '/api/posts');
    expect(envio?.body).toEqual({ categoryId: 2, content: 'Mutirão da horta no sábado' });
  });

  it('manda imagem e cidade quando preenchidas', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Água' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Água');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'Coleta de água da chuva');
    await userEvent.type(screen.getByLabelText('Link de uma imagem (opcional)'), 'https://exemplo.com/chuva.jpg');
    await userEvent.type(screen.getByLabelText('Cidade (opcional)'), 'Recife');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    await screen.findByRole('link', { name: '← Voltar para Explorar' });
    expect(chamadas.find((c) => c.method === 'POST')?.body).toEqual({
      categoryId: 3,
      content: 'Coleta de água da chuva',
      imageUrl: 'https://exemplo.com/chuva.jpg',
      city: 'Recife',
    });
  });

  it('mostra a cidade do perfil como dica', async () => {
    servidor();
    renderApp('/posts/novo');
    expect(await screen.findByText(/usamos a cidade do seu perfil \(Fortaleza\)/)).toBeInTheDocument();
  });

  it('não envia com campos inválidos, marca cada um e leva o foco ao primeiro', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Água' });

    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'ab');
    await userEvent.type(screen.getByLabelText('Link de uma imagem (opcional)'), 'ftp://x');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Escolha uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('A publicação precisa ter pelo menos 10 caracteres.')).toBeInTheDocument();
    expect(screen.getByText(/Digite um link válido/)).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Link de uma imagem (opcional)')).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(screen.getByLabelText('Categoria')).toHaveFocus());
    expect(chamadas.some((c) => c.method === 'POST')).toBe(false);
  });

  it('link de imagem sem http (por exemplo "abc") é marcado no campo', async () => {
    servidor();
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Água' });
    await userEvent.type(screen.getByLabelText('Link de uma imagem (opcional)'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByText(/Digite um link válido/)).toBeInTheDocument();
  });

  it('erro de campo devolvido pela API aparece no campo certo', async () => {
    servidor();
    mockApi({
      'GET /api/auth/me': () => json(USUARIA),
      'GET /api/categories': () => json(categoriasMock),
      'POST /api/posts': () =>
        json({ error: 'ValidationError', message: 'Dados da requisição inválidos', details: [{ path: 'imageUrl', message: 'Imagem inválida' }] }, 400),
    });
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Água' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Água');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'Texto válido');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Imagem inválida')).toBeInTheDocument();
    expect(screen.getByLabelText('Link de uma imagem (opcional)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled();
  });

  it('erro sem campo (categoria que não existe mais) aparece como aviso no topo', async () => {
    mockApi({
      'GET /api/auth/me': () => json(USUARIA),
      'GET /api/categories': () => json(categoriasMock),
      'POST /api/posts': () => json({ error: 'BadRequest', message: 'A categoria informada (categoryId) não existe' }, 400),
    });
    tokenStore.set('abc');
    renderApp('/posts/novo');
    await screen.findByRole('option', { name: 'Água' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Água');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'Texto válido');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A categoria informada (categoryId) não existe');
  });

  it('se as categorias não carregam, avisa e deixa tentar de novo', async () => {
    servidor({ categoriasFalham: 1 });
    renderApp('/posts/novo');
    expect(await screen.findByText(/Não consegui carregar as categorias/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('option', { name: 'Água' })).toBeInTheDocument();
  });

  it('a publicação nova aparece no topo do Explorar', async () => {
    servidor();
    renderApp('/explorar');
    await screen.findByText('Minha horta');
    await userEvent.click(screen.getByRole('link', { name: 'Publicar' }));
    await screen.findByRole('option', { name: 'Água' });
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Reciclagem');
    await userEvent.type(screen.getByLabelText('O que você quer compartilhar?'), 'Coleta de vidro no bairro');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await screen.findByRole('link', { name: '← Voltar para Explorar' });

    await userEvent.click(screen.getByRole('link', { name: '← Voltar para Explorar' }));
    const artigos = await screen.findAllByRole('article');
    await waitFor(() => expect(screen.getAllByRole('article')[0]).toHaveTextContent('Coleta de vidro no bairro'));
    expect(artigos.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Botões Editar e Excluir', () => {
  it('o autor vê Editar e Excluir', async () => {
    servidor();
    renderApp('/posts/5');
    expect(await screen.findByRole('link', { name: /^Editar publicação/ })).toHaveAttribute('href', '/posts/5/editar');
    expect(screen.getByRole('button', { name: /^Excluir publicação/ })).toBeInTheDocument();
  });

  it('outra pessoa não vê os botões', async () => {
    servidor();
    renderApp('/posts/6');
    await screen.findByText('Ação sustentável número 6');
    expect(screen.queryByRole('link', { name: /^Editar publicação/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Excluir publicação/ })).not.toBeInTheDocument();
  });

  it('o admin vê os botões em post de qualquer pessoa', async () => {
    servidor({ usuaria: ADMIN });
    renderApp('/posts/6');
    expect(await screen.findByRole('link', { name: /^Editar publicação/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Excluir publicação/ })).toBeInTheDocument();
  });

  it('visitante não vê os botões', async () => {
    servidor({ usuaria: null });
    renderApp('/posts/5');
    await screen.findByText('Minha horta');
    expect(screen.queryByRole('link', { name: /^Editar publicação/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Excluir publicação/ })).not.toBeInTheDocument();
  });
});

describe('Botões nos cartões do Explorar', () => {
  it('o admin vê Editar e Excluir em todos os cartões', async () => {
    servidor({ usuaria: ADMIN });
    renderApp('/explorar');
    await screen.findByText('Minha horta');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Excluir publicação/ })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /^Editar publicação/ })).toHaveLength(2);
  });

  it('uma pessoa comum vê os botões só nos cartões dela', async () => {
    servidor();
    renderApp('/explorar');
    await screen.findByText('Minha horta');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Excluir publicação/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Excluir publicação de Maria Souza' })).toBeInTheDocument();
  });

  it('visitante não vê botão nenhum', async () => {
    servidor({ usuaria: null });
    renderApp('/explorar');
    await screen.findByText('Minha horta');
    expect(screen.queryByRole('button', { name: /^Excluir publicação/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Editar publicação/ })).not.toBeInTheDocument();
  });

  it('o admin exclui pelo cartão: pede confirmação, a publicação some e aparece o aviso', async () => {
    const { chamadas } = servidor({ usuaria: ADMIN });
    renderApp('/explorar');
    await screen.findByText('Ação sustentável número 6');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir publicação de Pessoa 6' }));
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));

    expect(await screen.findByText('Publicação excluída.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Ação sustentável número 6')).not.toBeInTheDocument());
    expect(screen.getByText('Minha horta')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'DELETE')?.path).toBe('/api/posts/6');
  });
});

describe('Editar', () => {
  it('abre com os dados atuais e manda só o que mudou', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5/editar');

    const texto = await screen.findByLabelText('O que você quer compartilhar?');
    expect(texto).toHaveValue('Minha horta');
    expect(screen.getByLabelText('Link de uma imagem (opcional)')).toHaveValue('https://x.com/a.jpg');
    expect(screen.getByLabelText('Cidade (opcional)')).toHaveValue('Fortaleza');
    await waitFor(() => expect(screen.getByLabelText('Categoria')).toHaveValue('1'));

    await userEvent.clear(texto);
    await userEvent.type(texto, 'Minha horta cresceu');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('link', { name: '← Voltar para Explorar' })).toBeInTheDocument();
    expect(await screen.findByText('Minha horta cresceu')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ content: 'Minha horta cresceu' });
  });

  it('apagar imagem e cidade manda null', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5/editar');
    await screen.findByLabelText('O que você quer compartilhar?');
    await userEvent.clear(screen.getByLabelText('Link de uma imagem (opcional)'));
    await userEvent.clear(screen.getByLabelText('Cidade (opcional)'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await screen.findByRole('link', { name: '← Voltar para Explorar' });
    expect(chamadas.find((c) => c.method === 'PATCH')?.body).toEqual({ imageUrl: null, city: null });
  });

  it('sem mudanças avisa e não chama a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5/editar');
    await screen.findByLabelText('O que você quer compartilhar?');
    await waitFor(() => expect(screen.getByLabelText('Categoria')).toHaveValue('1'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Você não alterou nada.');
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('imagem inválida na edição é marcada e não envia', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5/editar');
    const imagem = await screen.findByLabelText('Link de uma imagem (opcional)');
    await userEvent.clear(imagem);
    await userEvent.type(imagem, 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText(/Digite um link válido/)).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('quem não é o autor não vê o formulário', async () => {
    servidor();
    renderApp('/posts/6/editar');
    expect(await screen.findByText('Você só pode editar as suas próprias publicações.')).toBeInTheDocument();
    expect(screen.queryByLabelText('O que você quer compartilhar?')).not.toBeInTheDocument();
  });

  it('o admin edita post de outra pessoa', async () => {
    const { chamadas } = servidor({ usuaria: ADMIN });
    renderApp('/posts/6/editar');
    const texto = await screen.findByLabelText('O que você quer compartilhar?');
    await userEvent.clear(texto);
    await userEvent.type(texto, 'Texto moderado pelo admin');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByRole('link', { name: '← Voltar para Explorar' })).toBeInTheDocument();
    expect(await screen.findByText('Texto moderado pelo admin')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')?.path).toBe('/api/posts/6');
  });

  it('post que não existe mostra o aviso', async () => {
    servidor();
    renderApp('/posts/999/editar');
    expect(await screen.findByRole('heading', { name: 'Publicação não encontrada' })).toBeInTheDocument();
  });

  it('visitante é levado para entrar', async () => {
    servidor({ usuaria: null });
    renderApp('/posts/5/editar');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });
});

describe('Excluir', () => {
  it('pede confirmação, exclui, volta ao Explorar com aviso e a publicação some da lista', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    await userEvent.click(await screen.findByRole('button', { name: /^Excluir publicação/ }));
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);

    const grupo = screen.getByRole('group', { name: 'Confirmar exclusão da publicação' });
    await userEvent.click(within(grupo).getByRole('button', { name: 'Sim, excluir' }));

    expect(await screen.findByRole('heading', { name: 'Explorar publicações' })).toBeInTheDocument();
    expect(await screen.findByText('Publicação excluída.')).toBeInTheDocument();
    expect(await screen.findByText('Ação sustentável número 6')).toBeInTheDocument();
    expect(screen.queryByText('Minha horta')).not.toBeInTheDocument();
    expect(chamadas.filter((c) => c.method === 'DELETE')).toHaveLength(1);
  });

  it('cancelar não exclui', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    await userEvent.click(await screen.findByRole('button', { name: /^Excluir publicação/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: /^Excluir publicação/ })).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('o admin exclui post de outra pessoa', async () => {
    const { chamadas } = servidor({ usuaria: ADMIN });
    renderApp('/posts/6');
    await userEvent.click(await screen.findByRole('button', { name: /^Excluir publicação/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    expect(await screen.findByText('Publicação excluída.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'DELETE')?.path).toBe('/api/posts/6');
  });

  it('se a API recusar, mostra o erro e continua na página', async () => {
    servidor();
    mockApi({
      'GET /api/auth/me': () => json(USUARIA),
      'GET /api/posts/5': () => json(post(5, { author: MINHA })),
      'GET /api/posts/5/comments': () => json(SEM_COMENTARIOS),
      'DELETE /api/posts/5': () => json({ error: 'Forbidden', message: 'Você só pode alterar os seus próprios posts' }, 403),
    });
    renderApp('/posts/5');
    await userEvent.click(await screen.findByRole('button', { name: /^Excluir publicação/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Você só pode alterar os seus próprios posts');
    expect(screen.getByText('Ação sustentável número 5')).toBeInTheDocument();
  });
});
