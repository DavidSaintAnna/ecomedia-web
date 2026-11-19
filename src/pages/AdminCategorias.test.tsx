import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import type { Category } from '../api/types';
import { USUARIA, json, mockApi, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const ADMIN = { ...USUARIA, id: 1, name: 'Administrador EcoMedia', role: 'ADMIN' };

/** API de mentira com memória das categorias: criar, editar e excluir mudam a lista. `comPosts` = ids que a API se recusa a excluir (409). */
function servidor({ usuaria = ADMIN as typeof USUARIA | null, comPosts = [] as number[] } = {}) {
  const banco: Category[] = [
    { id: 1, name: 'Reciclagem', description: 'Separar e reaproveitar' },
    { id: 2, name: 'Água', description: null },
    { id: 3, name: 'Energia', description: 'Gastar menos' },
  ];
  let proximo = 10;
  if (usuaria) tokenStore.set('abc');
  const rotas: Parameters<typeof mockApi>[0] = {
    'GET /api/auth/me': () => (usuaria ? json(usuaria) : json({ error: 'Unauthorized', message: 'Token inválido' }, 401)),
    'GET /api/categories': () => json(banco),
    'GET /api/posts': () => json({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    'POST /api/categories': ({ body }) => {
      const b = body as { name: string; description?: string };
      if (banco.some((c) => c.name === b.name)) return json({ error: 'Conflict', message: 'Categoria já existe' }, 409);
      const nova = { id: proximo++, name: b.name, description: b.description ?? null };
      banco.push(nova);
      return json(nova, 201);
    },
  };
  for (const c of [...banco, { id: 99, name: '', description: null }]) {
    rotas[`PUT /api/categories/${c.id}`] = ({ body }) => {
      const b = body as { name: string; description: string | null };
      if (banco.some((o) => o.id !== c.id && o.name === b.name)) return json({ error: 'Conflict', message: 'Já existe um registro com esses valores' }, 409);
      const atual = banco.find((o) => o.id === c.id)!;
      Object.assign(atual, b);
      return json(atual);
    };
    rotas[`DELETE /api/categories/${c.id}`] = () => {
      if (comPosts.includes(c.id)) return json({ error: 'Conflict', message: 'Este registro está sendo usado por outros dados e não pode ser removido' }, 409);
      banco.splice(banco.findIndex((o) => o.id === c.id), 1);
      return new Response(null, { status: 204 });
    };
  }
  const chamadas = mockApi(rotas);
  return { chamadas, banco };
}


describe('Administração de categorias', () => {
  it('administrador vê a lista em ordem alfabética, com descrição ou "Sem descrição"', async () => {
    servidor();
    renderApp('/admin/categorias');
    expect(await screen.findByRole('heading', { name: 'Categorias' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Categorias existentes (3)' })).toBeInTheDocument();
    const nomes = [...document.querySelectorAll('.categoria-nome')].map((n) => n.textContent);
    expect(nomes).toEqual(['Água', 'Energia', 'Reciclagem']);
    expect(screen.getByText('Sem descrição.')).toBeInTheDocument();
    expect(screen.getByText('Gastar menos')).toBeInTheDocument();
  });

  it('o link Categorias do menu só aparece para administrador', async () => {
    servidor();
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/admin/categorias');
  });

  it('pessoa comum vê "Acesso restrito" e nenhum link no menu', async () => {
    servidor({ usuaria: USUARIA });
    renderApp('/admin/categorias');
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Categorias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Criar categoria' })).not.toBeInTheDocument();
  });

  it('visitante é levado para entrar', async () => {
    servidor({ usuaria: null });
    renderApp('/admin/categorias');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('cria uma categoria: manda o texto sem espaços sobrando, avisa e a lista cresce', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await screen.findByRole('heading', { name: 'Categorias existentes (3)' });
    await userEvent.type(screen.getByLabelText('Nome'), '  Mobilidade  ');
    await userEvent.type(screen.getByLabelText('Descrição (opcional)'), ' Bicicleta e a pé ');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));

    expect(await screen.findByText('Categoria “Mobilidade” criada.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.method === 'POST' && c.path === '/api/categories')?.body).toEqual({ name: 'Mobilidade', description: 'Bicicleta e a pé' });
    expect(await screen.findByRole('heading', { name: 'Categorias existentes (4)' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveValue(''); // formulário limpo para a próxima
  });

  it('descrição vazia fica de fora do corpo', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await userEvent.type(await screen.findByLabelText('Nome'), 'Mobilidade');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    await screen.findByText('Categoria “Mobilidade” criada.');
    expect(chamadas.find((c) => c.method === 'POST' && c.path === '/api/categories')?.body).toEqual({ name: 'Mobilidade' });
  });

  it('nome curto demais é marcado no campo, sem chamar a API', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await userEvent.type(await screen.findByLabelText('Nome'), 'A');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    expect(await screen.findByText('O nome precisa ter pelo menos 2 letras.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(chamadas.some((c) => c.method === 'POST')).toBe(false);
  });

  it('nome repetido: a mensagem aparece no campo do nome', async () => {
    servidor();
    renderApp('/admin/categorias');
    await userEvent.type(await screen.findByLabelText('Nome'), 'Reciclagem');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    expect(await screen.findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true');
  });

  it('edita no lugar: manda nome e descrição, e apagar a descrição manda null', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar a categoria Energia' }));
    const form = screen.getByRole('form', { name: 'Editar a categoria Energia' });
    const nome = within(form).getByLabelText('Nome');
    expect(nome).toHaveValue('Energia');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'Energia limpa');
    await userEvent.clear(within(form).getByLabelText('Descrição (opcional)'));
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.queryByRole('form', { name: /Editar a categoria/ })).not.toBeInTheDocument());
    expect(chamadas.find((c) => c.method === 'PUT' && c.path === '/api/categories/3')?.body).toEqual({ name: 'Energia limpa', description: null });
    expect(await screen.findByText('Energia limpa', { selector: '.categoria-nome' })).toBeInTheDocument();
  });

  it('cancelar a edição não chama a API; só uma categoria fica aberta de cada vez', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar a categoria Energia' }));
    await userEvent.click(screen.getByRole('button', { name: 'Editar a categoria Água' }));
    expect(screen.getAllByRole('form', { name: /Editar a categoria/ })).toHaveLength(1);
    expect(screen.getByRole('form', { name: 'Editar a categoria Água' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('form', { name: /Editar a categoria/ })).not.toBeInTheDocument();
    expect(chamadas.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('renomear para um nome que já existe mostra o erro no campo e mantém a edição aberta', async () => {
    servidor();
    renderApp('/admin/categorias');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar a categoria Energia' }));
    const form = screen.getByRole('form', { name: 'Editar a categoria Energia' });
    const nome = within(form).getByLabelText('Nome');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'Reciclagem');
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }));
    expect(await within(form).findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument();
    expect(form).toBeInTheDocument();
  });

  it('exclui pedindo confirmação, e "Cancelar" desiste', async () => {
    const { chamadas } = servidor();
    renderApp('/admin/categorias');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir a categoria Água' }));
    expect(screen.getByRole('group', { name: 'Confirmar exclusão da categoria Água' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(chamadas.some((c) => c.method === 'DELETE')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Excluir a categoria Água' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    expect(await screen.findByRole('heading', { name: 'Categorias existentes (2)' })).toBeInTheDocument();
    expect(screen.queryByText('Água', { selector: '.categoria-nome' })).not.toBeInTheDocument();
  });

  it('categoria com publicações: a API recusa (409) e o aviso explica o que fazer', async () => {
    servidor({ comPosts: [1] });
    renderApp('/admin/categorias');
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir a categoria Reciclagem' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Essa categoria já tem publicações, então não pode ser excluída');
    expect(screen.getByText('Reciclagem', { selector: '.categoria-nome' })).toBeInTheDocument(); // continua na lista
  });

  it('lista que não carrega mostra o erro e dá para tentar de novo', async () => {
    let falhar = true;
    tokenStore.set('abc');
    mockApi({
      'GET /api/auth/me': () => json(ADMIN),
      'GET /api/categories': () => (falhar ? json({ error: 'InternalServerError', message: 'Algo deu errado. Tente novamente mais tarde' }, 500) : json([{ id: 1, name: 'Reciclagem', description: null }])),
    });
    renderApp('/admin/categorias');
    expect(await screen.findByText(/Não consegui carregar as categorias/)).toBeInTheDocument();
    falhar = false;
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Reciclagem', { selector: '.categoria-nome' })).toBeInTheDocument();
  });
});
