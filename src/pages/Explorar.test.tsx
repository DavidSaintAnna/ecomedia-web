import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { categoriasMock, json, mockApi, post, renderApp, responderPosts } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const daLista = (chamadas: ReturnType<typeof mockApi>) => chamadas.filter((c) => c.path === '/api/posts');
const ultima = (chamadas: ReturnType<typeof mockApi>) => daLista(chamadas).at(-1)!;

// 25 posts: 12 de Reciclagem (id 1), 8 de Hortas (id 2), 5 de Água (id 3); as cidades se alternam
function muitos() {
  return Array.from({ length: 25 }, (_, i) => {
    const id = i + 1;
    const categoria = id <= 12 ? categoriasMock[0] : id <= 20 ? categoriasMock[1] : categoriasMock[2];
    return post(id, {
      category: { id: categoria.id, name: categoria.name },
      city: id % 2 === 0 ? 'Fortaleza' : 'Aracaju',
      content: id === 14 ? 'Mutirão da horta do bairro' : `Ação sustentável número ${id}`,
    });
  }).reverse(); // mais novos primeiro, como a API
}

function montar(todos = muitos()) {
  return mockApi({
    'GET /api/posts': responderPosts(todos),
    'GET /api/categories': () => json(categoriasMock),
  });
}

describe('Explorar: lista', () => {
  it('mostra as publicações com autor, categoria, cidade, data e contadores', async () => {
    mockApi({
      'GET /api/posts': responderPosts([
        post(1, {
          likesCount: 1,
          commentsCount: 2,
          category: { id: 2, name: 'Hortas comunitárias' },
          content: 'Plantamos 30 mudas na praça',
        }),
      ]),
      'GET /api/categories': () => json(categoriasMock),
    });
    renderApp('/explorar');

    const cartao = await screen.findByRole('article');
    expect(within(cartao).getByText('Pessoa 1')).toBeInTheDocument();
    expect(within(cartao).getByText('Hortas comunitárias')).toBeInTheDocument();
    expect(within(cartao).getByText('Plantamos 30 mudas na praça')).toBeInTheDocument();
    expect(within(cartao).getByText('1 curtida')).toBeInTheDocument();
    expect(within(cartao).getByText('2 comentários')).toBeInTheDocument();
    expect(within(cartao).getByText('05/01/2026, 12:00')).toHaveAttribute('datetime', '2026-01-05T15:00:00.000Z');
    expect(within(cartao).getByText(/· Fortaleza/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1 publicação' })).toBeInTheDocument();
  });

  it('primeira chamada: página 1, 10 por página e nenhum filtro vazio', async () => {
    const chamadas = montar();
    renderApp('/explorar');
    await screen.findAllByRole('article');

    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ page: '1', limit: '10' });
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getByRole('heading', { name: '25 publicações' })).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('mostra "editado" só quando a diferença é grande', async () => {
    mockApi({
      'GET /api/posts': responderPosts([post(1, { updatedAt: '2026-01-06T15:00:00.000Z' }), post(2)]),
      'GET /api/categories': () => json(categoriasMock),
    });
    renderApp('/explorar');
    await screen.findAllByRole('article');
    expect(screen.getAllByText(/· editado/)).toHaveLength(1);
  });

  it('imagem com link quebrado vira um aviso', async () => {
    mockApi({
      'GET /api/posts': responderPosts([post(1, { imageUrl: 'https://exemplo.com/quebrada.jpg' })]),
      'GET /api/categories': () => json(categoriasMock),
    });
    renderApp('/explorar');

    const imagem = await screen.findByAltText('Foto enviada por Pessoa 1');
    fireEvent.error(imagem);
    expect(await screen.findByText('Imagem indisponível')).toBeInTheDocument();
  });
});

describe('Explorar: filtros', () => {
  it('lista as categorias em ordem alfabética do português (Água primeiro)', async () => {
    montar();
    renderApp('/explorar');
    await screen.findAllByRole('article');

    const nomes = screen.getAllByRole('option').map((o) => o.textContent);
    expect(nomes).toEqual(['Todas as categorias', 'Água', 'Hortas comunitárias', 'Reciclagem']);
  });

  it('escolher uma categoria filtra na hora e mostra só posts dela', async () => {
    const chamadas = montar();
    renderApp('/explorar');
    await screen.findAllByRole('article');

    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Hortas comunitárias');

    expect(await screen.findByRole('heading', { name: '8 publicações encontradas' })).toBeInTheDocument();
    expect(ultima(chamadas).query.get('categoryId')).toBe('2');
    for (const cartao of screen.getAllByRole('article')) {
      expect(within(cartao).getByText('Hortas comunitárias')).toBeInTheDocument();
    }
  });

  it('buscar por texto e cidade manda os dois filtros e volta para a página 1', async () => {
    const chamadas = montar();
    renderApp('/explorar?page=2');
    await screen.findByText('Página 2 de 3');

    await userEvent.type(screen.getByLabelText('Buscar no texto'), '  horta ');
    await userEvent.type(screen.getByLabelText('Cidade'), 'Fortaleza');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByText('Mutirão da horta do bairro')).toBeInTheDocument();
    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ q: 'horta', city: 'Fortaleza', page: '1', limit: '10' });
  });

  it('abre já filtrada quando o endereço traz os filtros (link compartilhado ou F5)', async () => {
    const chamadas = montar();
    renderApp('/explorar?q=horta&categoryId=2');

    expect(await screen.findByText('Mutirão da horta do bairro')).toBeInTheDocument();
    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ q: 'horta', categoryId: '2', page: '1', limit: '10' });
    expect(screen.getByLabelText('Buscar no texto')).toHaveValue('horta');
    expect(screen.getByLabelText('Categoria')).toHaveValue('2');
  });

  it('valores estranhos no endereço não chegam à API', async () => {
    const chamadas = montar();
    renderApp('/explorar?page=abc&categoryId=0&q=%20&city=');
    await screen.findAllByRole('article');

    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ page: '1', limit: '10' });
  });

  it('Limpar filtros tira tudo e mostra a lista completa', async () => {
    const chamadas = montar();
    renderApp('/explorar?categoryId=3');
    expect(await screen.findByRole('heading', { name: '5 publicações encontradas' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(await screen.findByRole('heading', { name: '25 publicações' })).toBeInTheDocument();
    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ page: '1', limit: '10' });
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });
});

describe('Explorar: paginação', () => {
  it('Próxima abre a página 2, mantém os filtros e leva o foco ao resultado', async () => {
    const chamadas = montar();
    renderApp('/explorar?city=Fortaleza');
    await screen.findByText('Página 1 de 2'); // 12 posts de Fortaleza

    await userEvent.click(screen.getByRole('link', { name: /Próxima/ }));

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
    expect(Object.fromEntries(ultima(chamadas).query)).toEqual({ city: 'Fortaleza', page: '2', limit: '10' });
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '12 publicações encontradas' })).toHaveFocus();
  });

  it('na primeira página o Anterior está inativo; na última, o Próxima', async () => {
    montar();
    renderApp('/explorar?page=3');
    await screen.findByText('Página 3 de 3');

    expect(screen.getByText('Próxima →')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('link', { name: /Anterior/ }));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('não mostra paginação quando cabe tudo numa página', async () => {
    mockApi({ 'GET /api/posts': responderPosts([post(1), post(2)]), 'GET /api/categories': () => json(categoriasMock) });
    renderApp('/explorar');
    await screen.findAllByRole('article');
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('página que não existe oferece voltar à primeira', async () => {
    montar();
    renderApp('/explorar?page=9');

    expect(await screen.findByText(/Esta página não existe: há só 3 páginas/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Voltar à primeira página' }));
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();
  });
});

describe('Explorar: estados', () => {
  it('mostra carregando e depois a lista', async () => {
    montar();
    renderApp('/explorar');
    expect(screen.getByText('Carregando publicações…')).toBeInTheDocument();
    await screen.findAllByRole('article');
    expect(screen.queryByText('Carregando publicações…')).not.toBeInTheDocument();
  });

  it('sem resultado com filtro: avisa e oferece limpar', async () => {
    montar();
    renderApp('/explorar?q=xyz');
    expect(await screen.findByText(/Nenhuma publicação encontrada com esses filtros/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' })).toHaveLength(1); // só o do formulário
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('banco sem publicações: mensagem própria, sem botão de limpar', async () => {
    mockApi({ 'GET /api/posts': responderPosts([]), 'GET /api/categories': () => json(categoriasMock) });
    renderApp('/explorar');
    expect(await screen.findByText(/Ainda não há publicações/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('erro da API: mostra a mensagem e deixa tentar de novo', async () => {
    let tentativas = 0;
    mockApi({
      'GET /api/posts': (c) => {
        tentativas += 1;
        return tentativas === 1
          ? json({ error: 'TooManyRequests', message: 'Muitas requisições. Tente novamente mais tarde' }, 429)
          : responderPosts([post(1)])(c);
      },
      'GET /api/categories': () => json(categoriasMock),
    });
    renderApp('/explorar');

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas requisições');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('article')).toBeInTheDocument();
  });

  it('categorias fora do ar não impedem de ver as publicações', async () => {
    mockApi({
      'GET /api/posts': responderPosts([post(1)]),
      'GET /api/categories': () => json({ error: 'InternalServerError', message: 'Algo deu errado' }, 500),
    });
    renderApp('/explorar');
    expect(await screen.findByRole('article')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
  });
});
