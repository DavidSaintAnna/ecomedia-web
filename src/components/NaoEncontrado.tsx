import { Link } from 'react-router';

export function NaoEncontrado() {
  return (
    <section className="pagina-mensagem">
      <h1>Publicação não encontrada</h1>
      <p>Ela pode ter sido excluída, ou o endereço está errado.</p>
      <div className="acoes-form">
        <Link to="/explorar" className="btn">
          Ver outras publicações
        </Link>
      </div>
    </section>
  );
}
