import { Link } from 'react-router';

export function NotFound() {
  return (
    <section className="pagina-404">
      <p className="codigo" aria-hidden="true">
        404
      </p>
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe por aqui.</p>
      <div className="acoes-form">
        <Link to="/" className="btn">
          Voltar para o início
        </Link>
        <Link to="/explorar" className="btn btn-claro">
          Explorar publicações
        </Link>
      </div>
    </section>
  );
}
