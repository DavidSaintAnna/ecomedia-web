import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import type { Comment, Post } from '../api/types';
import { USUARIA, json, mockApi, post, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const ADMIN = { ...USUARIA, id: 1, name: 'Admin EcoMedia', role: 'ADMIN' };

function comentario(id: number, autorId: number, nome: string, content: string): Comment {
  return { id, postId: 5, content, createdAt: '2026-01-05T16:00:00.000Z', editedAt: null, author: { id: autorId, name: nome, avatarUrl: null } };
}

interface Opcoes {
  usuaria?: typeof USUARIA | null;
  postInicial?: Post;
  comentarios?: Comment[];
}

/** Um "servidor" de mentira com memória: curtir alterna, comentar acrescenta, excluir remove. */
function servidor({ usuaria = USUARIA, postInicial, comentarios }: Opcoes = {}) {
  const estado = {
    liked: postInicial?.likedByMe ?? false,
    likes: postInicial?.likesCount ?? 4,
    comentarios: comentarios ?? [comentario(101, 7, 'Maria Souza', 'Também faço isso!'), comentario(102, 30, 'Carlos Lima', 'Parabéns pela ideia.')],
    proximoId: 200,
  };
  const base = postInicial ?? post(5);
  const atual = (): Post => ({ ...base, likedByMe: estado.liked, likesCount: estado.likes, commentsCount: estado.comentarios.length });

  if (usuaria) tokenStore.set('abc');

  const rotas: Parameters<typeof mockApi>[0] = {
    'GET /api/auth/me': () => (usuaria ? json(usuaria) : json({ error: 'Unauthorized', message: 'Token inválido ou expirado' }, 401)),
    'GET /api/posts/5': () => json(atual()),
    'GET /api/posts/5/comments': ({ query }) => {
      const page = Number(query.get('page') ?? 1);
      const limit = Number(query.get('limit') ?? 10);
      return json({
        data: estado.comentarios.slice((page - 1) * limit, page * limit),
        meta: { page, limit, total: estado.comentarios.length, totalPages: Math.max(1, Math.ceil(estado.comentarios.length / limit)) },
      });
    },
    'POST /api/posts/5/like': () => {
      estado.liked = !estado.liked;
      estado.likes += estado.liked ? 1 : -1;
      return json({ liked: estado.liked, likesCount: estado.likes });
    },
    'POST /api/posts/5/comments': ({ body }) => {
      const novo = comentario(estado.proximoId++, usuaria?.id ?? 0, usuaria?.name ?? '', (body as { content: string }).content);
      estado.comentarios.push(novo);
      return json(novo, 201);
    },
  };
  for (const c of estado.comentarios) {
    rotas[`PATCH /api/comments/${c.id}`] = ({ body }) => {
      const atual = estado.comentarios.find((x) => x.id === c.id)!;
      atual.content = (body as { content: string }).content;
      atual.editedAt = '2026-01-06T10:00:00.000Z';
      return json(atual);
    };
    rotas[`DELETE /api/comments/${c.id}`] = () => {
      estado.comentarios = estado.comentarios.filter((x) => x.id !== c.id);
      return new Response(null, { status: 204 });
    };
  }
  const chamadas = mockApi(rotas);
  return { chamadas, estado };
}

describe('Página do post', () => {
  it('mostra a publicação e os comentários do mais antigo para o mais novo', async () => {
    servidor();
    renderApp('/posts/5');

    expect(await screen.findByText('Ação sustentável número 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2 comentários' })).toBeInTheDocument();
    const itens = await screen.findAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(within(itens[0]).getByText('Também faço isso!')).toBeInTheDocument();
    expect(within(itens[1]).getByText('Parabéns pela ideia.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver publicação/ })).not.toBeInTheDocument();
  });

  it('publicação que não existe (404) mostra o aviso', async () => {
    mockApi({ 'GET /api/posts/9': () => json({ error: 'NotFound', message: 'Post não encontrado' }, 404) });
    renderApp('/posts/9');
    expect(await screen.findByRole('heading', { name: 'Publicação não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver outras publicações' })).toBeInTheDocument();
  });

  it('endereço com id que não é número nem chama a API', async () => {
    const chamadas = mockApi();
    renderApp('/posts/abc');
    expect(await screen.findByRole('heading', { name: 'Publicação não encontrada' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.path.startsWith('/api/posts/'))).toBe(false);
  });

  it('erro de servidor deixa tentar de novo', async () => {
    let n = 0;
    mockApi({
      'GET /api/posts/5': () => {
        n += 1;
        return n === 1 ? json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500) : json(post(5));
      },
      'GET /api/posts/5/comments': () => json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
    });
    renderApp('/posts/5');
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo deu errado');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Ação sustentável número 5')).toBeInTheDocument();
  });

  it('chega pela lista do Explorar clicando nos comentários do cartão', async () => {
    servidor();
    mockApi({
      'GET /api/posts': () => json({ data: [post(5, { commentsCount: 2 })], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }),
      'GET /api/categories': () => json([]),
      'GET /api/posts/5': () => json(post(5, { commentsCount: 2 })),
      'GET /api/posts/5/comments': () => json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
    });
    renderApp('/explorar');

    await userEvent.click(await screen.findByRole('link', { name: /Ver publicação de Pessoa 5/ }));
    expect(await screen.findByRole('link', { name: '← Voltar para Explorar' })).toBeInTheDocument();
  });
});

describe('Curtir', () => {
  it('muda na hora, confere com a API e curtir de novo volta ao número inicial', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    const botao = await screen.findByRole('button', { name: /Curtir/ });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('4 curtidas')).toBeInTheDocument();

    await userEvent.click(botao);
    expect(await screen.findByText('5 curtidas')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Curtir/ })).toHaveAttribute('aria-pressed', 'true'));

    await userEvent.click(screen.getByRole('button', { name: /Curtir/ }));
    expect(await screen.findByText('4 curtidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Curtir/ })).toHaveAttribute('aria-pressed', 'false');
    expect(chamadas.filter((c) => c.path === '/api/posts/5/like')).toHaveLength(2);
  });

  it('o número aparece antes da resposta, o botão fica desligado e vale o que a API disser', async () => {
    servidor();
    let responder!: (r: Response) => void;
    const espera = new Promise<Response>((resolve) => (responder = resolve));
    // troca só a rota de curtir por uma que demora, para dar tempo de ver o "durante"
    const fetchAntigo = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => (url.endsWith('/api/posts/5/like') ? espera : fetchAntigo(url, init))));
    renderApp('/posts/5');

    const botao = await screen.findByRole('button', { name: /Curtir/ });
    await userEvent.click(botao);

    expect(screen.getByText('5 curtidas')).toBeInTheDocument(); // na hora
    expect(screen.getByRole('button', { name: /Curtir/ })).toBeDisabled(); // sem clique duplo
    responder(json({ liked: true, likesCount: 9 })); // outra pessoa também curtiu nesse meio tempo
    expect(await screen.findByText('9 curtidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Curtir/ })).toBeEnabled();
  });

  it('se a API falhar, o número volta ao que era e aparece o aviso', async () => {
    servidor();
    const fetchAntigo = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) =>
        url.endsWith('/api/posts/5/like') ? json({ error: 'TooManyRequests', message: 'Muitas requisições. Tente novamente mais tarde' }, 429) : fetchAntigo(url, init),
      ),
    );
    renderApp('/posts/5');

    await userEvent.click(await screen.findByRole('button', { name: /Curtir/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas requisições');
    expect(screen.getByText('4 curtidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Curtir/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('visitante vê um link que leva a /entrar, e depois de entrar volta ao post', async () => {
    servidor({ usuaria: null });
    mockApi({
      'GET /api/posts/5': () => json(post(5)),
      'GET /api/posts/5/comments': () => json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
      'POST /api/auth/login': () => json({ user: USUARIA, token: 'novo' }),
    });
    renderApp('/posts/5');

    await userEvent.click(await screen.findByRole('link', { name: /Entre para curtir/ }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();

    const u = userEvent.setup();
    await u.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await u.type(screen.getByLabelText('Senha'), 'Senha12345');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: /Curtir/ })).toBeInTheDocument();
  });

  it('curtir pela lista do Explorar atualiza o cartão', async () => {
    tokenStore.set('abc');
    let curtido = false;
    mockApi({
      'GET /api/auth/me': () => json(USUARIA),
      'GET /api/posts': () => json({ data: [post(5, { likesCount: 2, likedByMe: curtido })], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } }),
      'GET /api/categories': () => json([]),
      'POST /api/posts/5/like': () => {
        curtido = true;
        return json({ liked: true, likesCount: 3 });
      },
    });
    renderApp('/explorar');

    await userEvent.click(await screen.findByRole('button', { name: /Curtir/ }));
    expect(await screen.findByText('3 curtidas')).toBeInTheDocument();
  });
});

describe('Comentar', () => {
  it('envia o comentário, mostra na lista, limpa o campo e atualiza o contador', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');

    await userEvent.type(await screen.findByLabelText('Escreva um comentário'), '  Muito bom!  ');
    expect(screen.getByText('14/500 · mínimo 10')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    expect(await screen.findByText('Muito bom!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3 comentários' })).toBeInTheDocument();
    expect(screen.getByLabelText('Escreva um comentário')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Comentário publicado.');
    expect(chamadas.find((c) => c.method === 'POST' && c.path === '/api/posts/5/comments')?.body).toEqual({ content: 'Muito bom!' });
  });

  it('comentário vazio marca o campo e nem chama a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');

    await userEvent.click(await screen.findByRole('button', { name: 'Comentar' }));

    const campo = screen.getByLabelText('Escreva um comentário');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Escreva alguma coisa antes de enviar.')).toBeInTheDocument();
    expect(campo).toHaveFocus();
    expect(chamadas.some((c) => c.method === 'POST' && c.path.endsWith('/comments'))).toBe(false);
  });

  it('comentário com menos de 10 caracteres é recusado no campo, sem chamar a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');

    await userEvent.type(await screen.findByLabelText('Escreva um comentário'), '  Parabéns!  ');
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    expect(screen.getByText('O comentário precisa ter pelo menos 10 caracteres.')).toBeInTheDocument();
    expect(screen.getByLabelText('Escreva um comentário')).toHaveAttribute('aria-invalid', 'true');
    expect(chamadas.some((c) => c.method === 'POST' && c.path.endsWith('/comments'))).toBe(false);

    await userEvent.type(screen.getByLabelText('Escreva um comentário'), ' Muito!');
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    expect(await screen.findByText('Parabéns! Muito!')).toBeInTheDocument();
  });

  it('mostra o erro da API no campo', async () => {
    servidor();
    const fetchAntigo = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) =>
        init?.method === 'POST' && url.endsWith('/comments')
          ? json({ error: 'ValidationError', message: 'Dados da requisição inválidos', details: [{ path: 'content', message: 'Texto longo demais' }] }, 400)
          : fetchAntigo(url, init),
      ),
    );
    renderApp('/posts/5');

    await userEvent.type(await screen.findByLabelText('Escreva um comentário'), 'Um comentário válido');
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    expect(await screen.findByText('Texto longo demais')).toBeInTheDocument();
  });

  it('visitante não vê o formulário: vê o convite para entrar', async () => {
    servidor({ usuaria: null });
    mockApi({
      'GET /api/posts/5': () => json(post(5)),
      'GET /api/posts/5/comments': () => json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
    });
    renderApp('/posts/5');

    expect(await screen.findByText(/para comentar\./)).toBeInTheDocument();
    expect(screen.queryByLabelText('Escreva um comentário')).not.toBeInTheDocument();
    expect(await screen.findByText('Ainda não há comentários. Seja a primeira pessoa!')).toBeInTheDocument();
  });

  it('carrega mais comentários quando passa de 20', async () => {
    const muitos = Array.from({ length: 25 }, (_, i) => comentario(300 + i, 30, 'Carlos Lima', `Comentário ${i + 1}`));
    servidor({ comentarios: muitos });
    renderApp('/posts/5');

    await screen.findByText('Comentário 1');
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais comentários' }));
    expect(await screen.findByText('Comentário 25')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(25);
    expect(screen.queryByRole('button', { name: 'Carregar mais comentários' })).not.toBeInTheDocument();
  });
});

describe('Editar comentário', () => {
  it('só o autor vê Editar; o admin só vê Excluir', async () => {
    servidor();
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    const deOutra = screen.getByText('Parabéns pela ideia.').closest('li')!;
    expect(within(meu).getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(within(deOutra).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('o admin não pode editar comentário de ninguém', async () => {
    servidor({ usuaria: ADMIN });
    renderApp('/posts/5');
    await screen.findByText('Também faço isso!');
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(2);
  });

  it('visitante não vê Editar', async () => {
    servidor({ usuaria: null });
    renderApp('/posts/5');
    await screen.findByText('Também faço isso!');
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('abre o campo com o texto atual, salva, mostra o texto novo e a marca "editado"', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Editar' }));

    const campo = within(meu).getByLabelText('Editar comentário');
    expect(campo).toHaveValue('Também faço isso!');
    await userEvent.clear(campo);
    await userEvent.type(campo, '  Também faço isso, e recomendo!  ');
    await userEvent.click(within(meu).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Também faço isso, e recomendo!')).toBeInTheDocument();
    const item = screen.getByText('Também faço isso, e recomendo!').closest('li')!;
    expect(within(item).getByText(/editado/)).toBeInTheDocument();
    expect(within(item).queryByLabelText('Editar comentário')).not.toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'PATCH')).toMatchObject({ path: '/api/comments/101', body: { content: 'Também faço isso, e recomendo!' } });
  });

  it('menos de 10 caracteres é recusado no campo, sem chamar a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Editar' }));
    const campo = within(meu).getByLabelText('Editar comentário');
    await userEvent.clear(campo);
    await userEvent.type(campo, 'Curto');
    await userEvent.click(within(meu).getByRole('button', { name: 'Salvar' }));

    expect(within(meu).getByText('O comentário precisa ter pelo menos 10 caracteres.')).toBeInTheDocument();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('salvar sem mudar o texto só fecha, sem chamar a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Editar' }));
    await userEvent.click(within(meu).getByRole('button', { name: 'Salvar' }));

    expect(within(meu).queryByLabelText('Editar comentário')).not.toBeInTheDocument();
    expect(screen.getByText('Também faço isso!')).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('Cancelar desiste e mantém o texto antigo', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Editar' }));
    await userEvent.type(within(meu).getByLabelText('Editar comentário'), ' e mais um pouco');
    await userEvent.click(within(meu).getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Também faço isso!')).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('mostra o erro da API (por exemplo 403) e continua editando', async () => {
    servidor();
    const fetchAntigo = globalThis.fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) =>
        init?.method === 'PATCH' ? json({ error: 'Forbidden', message: 'Você só pode editar os seus próprios comentários' }, 403) : fetchAntigo(url, init),
      ),
    );
    renderApp('/posts/5');
    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Editar' }));
    await userEvent.type(within(meu).getByLabelText('Editar comentário'), ' de verdade');
    await userEvent.click(within(meu).getByRole('button', { name: 'Salvar' }));

    expect(await within(meu).findByText('Você só pode editar os seus próprios comentários')).toBeInTheDocument();
    expect(within(meu).getByLabelText('Editar comentário')).toBeInTheDocument();
  });
});

describe('Excluir comentário', () => {
  it('só aparece nos comentários da própria pessoa; pede confirmação e depois remove', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');

    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    const deOutra = screen.getByText('Parabéns pela ideia.').closest('li')!;
    expect(within(deOutra).queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();

    await userEvent.click(within(meu).getByRole('button', { name: 'Excluir' }));
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false); // ainda não: falta confirmar
    await userEvent.click(within(meu).getByRole('button', { name: 'Sim, excluir' }));

    await waitFor(() => expect(screen.queryByText('Também faço isso!')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: '1 comentário' })).toBeInTheDocument();
    expect(chamadas.filter((c) => c.method === 'DELETE').map((c) => c.path)).toEqual(['/api/comments/101']);
  });

  it('Cancelar desiste sem chamar a API', async () => {
    const { chamadas } = servidor();
    renderApp('/posts/5');

    const meu = (await screen.findByText('Também faço isso!')).closest('li')!;
    await userEvent.click(within(meu).getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(meu).getByRole('button', { name: 'Cancelar' }));

    expect(within(meu).getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('administrador vê Excluir em todos os comentários', async () => {
    servidor({ usuaria: ADMIN });
    renderApp('/posts/5');

    await screen.findByText('Também faço isso!');
    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(2);
  });

  it('visitante não vê Excluir', async () => {
    servidor({ usuaria: null });
    mockApi({
      'GET /api/posts/5': () => json(post(5)),
      'GET /api/posts/5/comments': () =>
        json({ data: [comentario(101, 7, 'Maria Souza', 'Também faço isso!')], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
    });
    renderApp('/posts/5');
    await screen.findByText('Também faço isso!');
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });
});
