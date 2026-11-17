import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, api, setUnauthorizedHandler } from '../api/client';
import { tokenStore } from '../api/token';
import type { AuthResponse, AuthUser } from '../api/types';
import { AuthContext, type AuthContextValue, type RegisterInput } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'ready'>(() => (tokenStore.get() ? 'loading' : 'ready'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionError, setSessionError] = useState<ApiError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  // Apaga o token e tudo que foi baixado em nome da pessoa (por exemplo likedByMe).
  const encerrar = useCallback(
    (expirou: boolean) => {
      tokenStore.clear();
      setUser(null);
      setSessionError(null);
      setSessionExpired(expirou);
      void queryClient.resetQueries();
    },
    [queryClient],
  );

  // Ao abrir o site: se há token guardado, a API confirma quem é a pessoa (GET /api/auth/me).
  useEffect(() => {
    if (!tokenStore.get()) {
      setStatus('ready');
      return;
    }
    const controller = new AbortController();
    setStatus('loading');
    api
      .get<AuthUser>('/api/auth/me', { signal: controller.signal })
      .then((me) => {
        setUser(me);
        setSessionError(null);
        setStatus('ready');
      })
      .catch((erro: unknown) => {
        if (controller.signal.aborted) return;
        if (erro instanceof ApiError && (erro.status === 401 || erro.status === 404)) {
          encerrar(true); // token vencido ou conta excluída
        } else if (erro instanceof ApiError) {
          setSessionError(erro); // sem rede ou servidor com problema: mantém o token e deixa tentar de novo
        }
        setStatus('ready');
      });
    return () => controller.abort();
  }, [tentativa, encerrar]);

  // Qualquer resposta 401 enquanto há token guardado derruba a sessão.
  useEffect(() => {
    setUnauthorizedHandler(() => encerrar(true));
    return () => setUnauthorizedHandler(null);
  }, [encerrar]);

  const entrou = useCallback(
    (resposta: AuthResponse) => {
      tokenStore.set(resposta.token);
      setUser(resposta.user);
      setSessionError(null);
      setSessionExpired(false);
      void queryClient.resetQueries();
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      entrou(await api.post<AuthResponse>('/api/auth/login', { email, password }, { auth: false }));
    },
    [entrou],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const city = input.city?.trim();
      const corpo = { name: input.name, email: input.email, password: input.password, ...(city ? { city } : {}) };
      entrou(await api.post<AuthResponse>('/api/auth/register', corpo, { auth: false }));
    },
    [entrou],
  );

  const logout = useCallback(() => encerrar(false), [encerrar]);
  const retrySession = useCallback(() => setTentativa((n) => n + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, sessionError, sessionExpired, login, register, logout, retrySession }),
    [status, user, sessionError, sessionExpired, login, register, logout, retrySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
