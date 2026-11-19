import { Link, Outlet } from 'react-router';
import { useAuth } from './auth-context';
import { ehAdmin } from '../lib/permissions';

// Dentro de RequireAuth: quem está logado mas não é administrador vê um aviso (a API também recusa com 403).
export function RequireAdmin() {
  const { user } = useAuth();
  if (!ehAdmin(user)) {
    return (
      <section className="pagina-mensagem">
        <h1>Acesso restrito</h1>
        <p>Só administradores podem abrir esta página.</p>
        <Link to="/" className="btn">
          Voltar para o início
        </Link>
      </section>
    );
  }
  return <Outlet />;
}
