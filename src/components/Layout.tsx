import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { ehAdmin } from '../lib/permissions';
import { useTituloDaPagina } from '../lib/useTituloDaPagina';
import { ServerStatus } from './ServerStatus';

export function Layout() {
  const { status, user, sessionError, retrySession, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  useTituloDaPagina();

  // Primeiro leva para o início, depois encerra a sessão. Na ordem inversa, uma tela que exige login
  // (como /conta) veria a sessão acabar antes da troca de página e mandaria a pessoa para /entrar.
  // Quem navega para "/" com state { sair: true } (o botão Sair, ou a exclusão da conta) pede esse encerramento.
  const saindo = (state as { sair?: boolean; aviso?: string } | null)?.sair === true;
  const aviso = (state as { aviso?: string } | null)?.aviso;
  useEffect(() => {
    if (saindo && pathname === '/') {
      logout();
      navigate('/', { replace: true, state: aviso ? { aviso } : null });
    }
  }, [saindo, aviso, pathname, logout, navigate]);

  function sair() {
    navigate('/', { state: { sair: true } });
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
            <NavLink to="/explorar">Explorar</NavLink>
            <NavLink to="/ranking">Ranking</NavLink>
            {user && <NavLink to="/feed">Feed</NavLink>}
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
                <NavLink to="/posts/novo" className="nav-destaque">
                  Publicar
                </NavLink>
                {ehAdmin(user) && <NavLink to="/admin/categorias">Categorias</NavLink>}
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
