import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../api/token';
import { USUARIA, json, mockApi, renderApp } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

const resposta = { user: USUARIA, token: 'token-novo' };

async function preencherCadastro(valores: { name?: string; email?: string; password?: string; city?: string }) {
  const u = userEvent.setup();
  if (valores.name !== undefined) await u.type(screen.getByLabelText('Nome'), valores.name);
  if (valores.email !== undefined) await u.type(screen.getByLabelText('E-mail'), valores.email);
  if (valores.password !== undefined) await u.type(screen.getByLabelText(/^Senha/), valores.password);
  if (valores.city !== undefined) await u.type(screen.getByLabelText(/Cidade/), valores.city);
  await u.click(screen.getByRole('button', { name: 'Criar conta' }));
}

describe('Criar conta', () => {
  it('envia os dados, guarda o token e volta ao início já logada', async () => {
    const chamadas = mockApi({ 'POST /api/auth/register': () => json(resposta, 201) });
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678' });

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /ações sustentáveis/i })).toBeInTheDocument();
    expect(tokenStore.get()).toBe('token-novo');

    const envio = chamadas.find((c) => c.path === '/api/auth/register');
    expect(envio?.body).toEqual({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678' }); // sem city vazia
    expect(envio?.headers).not.toHaveProperty('Authorization');
  });

  it('manda a cidade quando ela é preenchida', async () => {
    const chamadas = mockApi({ 'POST /api/auth/register': () => json(resposta, 201) });
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678', city: ' Fortaleza ' });
    await screen.findByRole('button', { name: 'Sair' });

    expect(chamadas.find((c) => c.path === '/api/auth/register')?.body).toMatchObject({ city: 'Fortaleza' });
  });

  it('senha curta marca o campo e nem chama a API', async () => {
    const chamadas = mockApi();
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '123' });

    const campo = screen.getByLabelText(/^Senha/);
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(/pelo menos 8 caracteres/);
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(campo).toHaveFocus();
    expect(chamadas.some((c) => c.path === '/api/auth/register')).toBe(false);
  });

  it('mostra no campo e-mail o aviso de e-mail já cadastrado (409)', async () => {
    mockApi({ 'POST /api/auth/register': () => json({ error: 'Conflict', message: 'E-mail já cadastrado' }, 409) });
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678' });

    expect(await screen.findByText('E-mail já cadastrado')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(tokenStore.get()).toBeNull();
  });

  it('leva os erros por campo da API (400) para os campos certos', async () => {
    mockApi({
      'POST /api/auth/register': () =>
        json(
          {
            error: 'ValidationError',
            message: 'Dados da requisição inválidos',
            details: [{ path: 'city', message: 'Texto longo demais' }],
          },
          400,
        ),
    });
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678', city: 'X' });

    expect(await screen.findByText('Texto longo demais')).toBeInTheDocument();
    expect(screen.getByLabelText(/Cidade/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('avisa quando o servidor não responde', async () => {
    mockApi();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    renderApp('/cadastro');

    await preencherCadastro({ name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678' });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não consegui falar com o servidor/);
  });
});

describe('Entrar', () => {
  async function entrar(email: string, senha: string) {
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('E-mail'), email);
    await u.type(screen.getByLabelText('Senha'), senha);
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
  }

  it('entra, guarda o token e mostra o menu de quem está logada', async () => {
    const chamadas = mockApi({ 'POST /api/auth/login': () => json(resposta) });
    renderApp('/entrar');

    await entrar('maria@exemplo.com', 'Senha12345');

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Maria' })).toBeInTheDocument();
    expect(tokenStore.get()).toBe('token-novo');
    expect(chamadas.find((c) => c.path === '/api/auth/login')?.body).toEqual({
      email: 'maria@exemplo.com',
      password: 'Senha12345',
    });
  });

  it('senha errada mostra o aviso da API e não guarda token', async () => {
    mockApi({ 'POST /api/auth/login': () => json({ error: 'Unauthorized', message: 'E-mail ou senha inválidos' }, 401) });
    renderApp('/entrar');

    await entrar('maria@exemplo.com', 'errada');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(tokenStore.get()).toBeNull();
  });

  it('campos vazios são marcados sem chamar a API', async () => {
    const chamadas = mockApi();
    renderApp('/entrar');

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(chamadas.some((c) => c.path === '/api/auth/login')).toBe(false);
  });
});

describe('Rota que exige login', () => {
  it('sem login leva para /entrar e, depois de entrar, volta para a tela pedida', async () => {
    mockApi({ 'POST /api/auth/login': () => json(resposta) });
    renderApp('/conta');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();

    const u = userEvent.setup();
    await u.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
    await u.type(screen.getByLabelText('Senha'), 'Senha12345');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByText('maria@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('17/11/2026, 06:06')).toBeInTheDocument(); // data em horário de Brasília
  });

  it('quem já está logada e abre /entrar vai para o início', async () => {
    tokenStore.set('abc');
    mockApi({ 'GET /api/auth/me': () => json(USUARIA) });
    renderApp('/entrar');

    expect(await screen.findByRole('heading', { name: /ações sustentáveis/i })).toBeInTheDocument();
  });
});

describe('Sessão guardada no navegador', () => {
  it('ao abrir o site, confirma o token em /api/auth/me e continua logada (F5)', async () => {
    tokenStore.set('abc');
    const chamadas = mockApi({ 'GET /api/auth/me': () => json(USUARIA) });
    renderApp('/conta');

    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === '/api/auth/me')?.headers).toMatchObject({ Authorization: 'Bearer abc' });
  });

  it('token vencido (401): limpa o token e trata como visitante', async () => {
    tokenStore.set('velho');
    mockApi({ 'GET /api/auth/me': () => json({ error: 'Unauthorized', message: 'Token inválido ou expirado' }, 401) });
    renderApp('/entrar');

    expect(await screen.findByText(/Sua sessão expirou/)).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
  });

  it('conta excluída (404 em /auth/me): limpa o token', async () => {
    tokenStore.set('abc');
    mockApi({ 'GET /api/auth/me': () => json({ error: 'NotFound', message: 'Usuário não existe mais' }, 404) });
    renderApp('/');

    await waitFor(() => expect(tokenStore.get()).toBeNull());
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('servidor fora do ar ao abrir: mantém o token e deixa tentar de novo', async () => {
    tokenStore.set('abc');
    let tentativas = 0;
    mockApi({
      'GET /api/auth/me': () => {
        tentativas += 1;
        return tentativas === 1 ? json({ error: 'InternalServerError', message: 'Algo deu errado' }, 500) : json(USUARIA);
      },
    });
    renderApp('/conta');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não consegui confirmar o seu login/);
    expect(tokenStore.get()).toBe('abc');

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
  });
});

describe('Sair', () => {
  it('apaga o token e volta ao início como visitante', async () => {
    tokenStore.set('abc');
    mockApi({ 'GET /api/auth/me': () => json(USUARIA) });
    renderApp('/conta');

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: /ações sustentáveis/i })).toBeInTheDocument();
    // a sessão termina logo depois da troca de tela, por isso se espera em vez de conferir na hora
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    await waitFor(() => expect(tokenStore.get()).toBeNull());
    expect(screen.queryByText(/Sua sessão expirou/)).not.toBeInTheDocument();
  });
});
