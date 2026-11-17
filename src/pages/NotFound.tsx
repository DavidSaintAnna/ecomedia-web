import { Link } from 'react-router';

export function NotFound() {
  return (
    <section className="hero">
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe por aqui.</p>
      <Link to="/" className="btn">
        Voltar para o início
      </Link>
    </section>
  );
}
