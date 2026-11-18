import { Link } from 'react-router';

export function NaoEncontrado() {
  return (
    <section className="hero">
      <h1>Publicação não encontrada</h1>
      <p>Ela pode ter sido excluída, ou o endereço está errado.</p>
      <Link to="/explorar" className="btn">
        Ver outras publicações
      </Link>
    </section>
  );
}
