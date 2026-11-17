import { ApiError, api, buildUrl, setUnauthorizedHandler } from './client';
import { tokenStore } from './token';

function resposta(status: number, corpo?: unknown, texto?: string) {
  return new Response(status === 204 ? null : (texto ?? JSON.stringify(corpo)), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('buildUrl', () => {
  it('pula filtros vazios, nulos e indefinidos', () => {
    const url = buildUrl('/api/posts', { q: '', city: '  ', categoryId: undefined, page: 2, extra: null });
    expect(url).toBe('http://localhost:3333/api/posts?page=2');
  });
});

describe('api', () => {
  it('devolve undefined em 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(204)));
    await expect(api.delete('/api/posts/1')).resolves.toBeUndefined();
  });

  it('transforma o corpo de erro da API em ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        resposta(400, {
          error: 'ValidationError',
          message: 'Dados inválidos',
          details: [{ path: 'email', message: 'E-mail inválido' }],
        }),
      ),
    );
    const erro = await api.post('/api/auth/register', {}).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ApiError);
    const apiErro = erro as ApiError;
    expect(apiErro.status).toBe(400);
    expect(apiErro.code).toBe('ValidationError');
    expect(apiErro.fieldMessage('email')).toBe('E-mail inválido');
  });

  it('avisa em português quando a rede falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const erro = (await api.get('/api/stats').catch((e: unknown) => e)) as ApiError;
    expect(erro.status).toBe(0);
    expect(erro.isNetwork).toBe(true);
    expect(erro.message).toMatch(/servidor/);
  });

  it('usa mensagem padrão quando a resposta não é JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(502, undefined, '<html>Bad gateway</html>')));
    const erro = (await api.get('/api/stats').catch((e: unknown) => e)) as ApiError;
    expect(erro.status).toBe(502);
    expect(erro.message).toMatch(/servidor/);
  });

  it('manda o token no cabeçalho Authorization, exceto com auth: false', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => resposta(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    tokenStore.set('abc');

    await api.get('/api/auth/me');
    await api.post('/api/auth/login', { a: 1 }, { auth: false });

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer abc' });
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty('Authorization');
  });

  it('chama o tratador de 401 só quando havia token guardado', async () => {
    const tratador = vi.fn();
    setUnauthorizedHandler(tratador);
    vi.stubGlobal('fetch', vi.fn(async () => resposta(401, { error: 'Unauthorized', message: 'Token inválido ou expirado' })));

    await api.get('/api/auth/me').catch(() => undefined);
    expect(tratador).not.toHaveBeenCalled();

    tokenStore.set('velho');
    await api.get('/api/auth/me').catch(() => undefined);
    expect(tratador).toHaveBeenCalledTimes(1);
  });
});
