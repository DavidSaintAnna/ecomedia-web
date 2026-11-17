import { Link } from 'react-router';
import { useStats } from '../api/hooks';
import type { Stats } from '../api/types';

const ROTULOS: [keyof Stats, string][] = [
  ['users', 'Pessoas'],
  ['posts', 'Publicações'],
  ['comments', 'Comentários'],
  ['likes', 'Curtidas'],
  ['categories', 'Categorias'],
  ['cities', 'Cidades'],
];

const numero = new Intl.NumberFormat('pt-BR');

export function Home() {
  const stats = useStats();

  return (
    <>
      <section className="hero">
        <h1>Ações sustentáveis perto de você</h1>
        <p>
          Compartilhe o que você faz pela sua cidade, descubra o que seus vizinhos estão fazendo e inspire mais gente a
          cuidar do lugar onde vive.
        </p>
        <Link to="/explorar" className="btn">
          Explorar publicações
        </Link>
      </section>

      <section aria-labelledby="titulo-numeros">
        <h2 id="titulo-numeros">A comunidade em números</h2>

        {stats.isPending && <p role="status">Carregando números…</p>}

        {stats.isError && (
          <div role="alert" className="aviso-erro">
            <p>{stats.error.message}</p>
            <button type="button" className="btn" onClick={() => void stats.refetch()}>
              Tentar de novo
            </button>
          </div>
        )}

        {stats.data && (
          <dl className="numeros">
            {ROTULOS.map(([chave, rotulo]) => (
              <div key={chave} className="numero">
                <dt>{rotulo}</dt>
                <dd>{numero.format(stats.data[chave])}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}
