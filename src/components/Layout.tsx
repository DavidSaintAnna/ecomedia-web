import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { ServerStatus } from './ServerStatus';

export function Layout() {
  const { status, user, sessionError, retrySession, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [saindo, setSaindo] = useState(false);

  // Primeiro leva para o início, depois encerra a sessão. Na ordem inversa, uma tela que exige login
  // (como /conta) veria a sessão acabar antes da troca de página e mandaria a pessoa para /entrar.
  useEffect(() => {
    if (saindo && pathname === '/') {
      logout();
      setSaindo(false);
    }
  }, [saindo, pathname, logout]);

  function sair() {
    setSaindo(true);
    navigate('/');
  }

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topo">
        <div className="container topo-linha">
          <Link to="/" className="marca" aria-label="EcoMedia, página inicial">
            <span aria-hidden="true">🌱</span> EcoMedia
          </Link>
          <nav aria-label="Principal">
            <NavLink to="/" end>
              Início
            </NavLink>
            {status === 'ready' && !user && (
              <>
                <NavLink to="/entrar">Entrar</NavLink>
                <NavLink to="/cadastro" className="nav-destaque">
                  Criar conta
                </NavLink>
              </>
            )}
            {user && (
              <>
                <NavLink to="/conta">{user.name.split(' ')[0]}</NavLink>
                <button type="button" className="nav-botao" onClick={sair}>
                  Sair
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <ServerStatus />
      {sessionError && !user && (
        <div className="banner banner-erro" role="alert">
          <span>Não consegui confirmar o seu login.</span>
          <button type="button" className="btn btn-pequeno" onClick={retrySession}>
            Tentar de novo
          </button>
        </div>
      )}
      <main id="conteudo" className="container">
        <Outlet />
      </main>
      <footer className="rodape">
        <div className="container">
          EcoMedia · projeto do Recode ligado ao ODS 11: cidades e comunidades sustentáveis.
        </div>
      </footer>
    </>
  );
}
