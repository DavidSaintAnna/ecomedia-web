import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './auth-context';

// Envolve as telas que exigem login. Sem login, leva para /entrar e guarda de onde a pessoa veio.
export function RequireAuth() {
  const { status, user, sessionError } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <p role="status">Confirmando o seu login…</p>;

  // O aviso com o botão "Tentar de novo" aparece no topo da página (Layout).
  if (!user && sessionError) return <p>Sem confirmar o seu login não dá para abrir esta página.</p>;

  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;

  return <Outlet />;
}
