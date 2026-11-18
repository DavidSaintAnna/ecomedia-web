import { createContext, useContext } from 'react';
import type { ApiError } from '../api/client';
import type { AuthUser } from '../api/types';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  city?: string;
}

export interface AuthContextValue {
  /** 'loading' enquanto o site confirma, na API, o login guardado no navegador. */
  status: 'loading' | 'ready';
  user: AuthUser | null;
  /** Preenchido quando não deu para confirmar o login (rede fora do ar); o token continua guardado. */
  sessionError: ApiError | null;
  /** true quando o login guardado venceu ou a conta não existe mais. */
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Atualiza, na tela, os dados da pessoa logada depois que a API aceitou uma edição do perfil. */
  updateUser: (dados: Partial<AuthUser>) => void;
  retrySession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return value;
}
