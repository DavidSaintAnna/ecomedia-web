import { Link, NavLink, Outlet } from 'react-router';
import { ServerStatus } from './ServerStatus';

export function Layout() {
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
          </nav>
        </div>
      </header>
      <ServerStatus />
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
