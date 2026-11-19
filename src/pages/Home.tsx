import { Link } from 'react-router';
import { useStats } from '../api/hooks';
import type { Stats } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { CategoriasEmMosaico } from '../components/CategoriasEmMosaico';
import { PublicacoesRecentes } from '../components/PublicacoesRecentes';
import { CenaDoBairro } from '../ilustracoes/CenaDoBairro';
import { Horizonte } from '../ilustracoes/Horizonte';
import { useAviso } from '../lib/useAviso';

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
  const { status, user } = useAuth();
  const [aviso] = useAviso();

  return (
    <>
      {aviso && (
        <p role="status" className="aviso">
          {aviso}
        </p>
      )}

      <section className="hero">
        <div className="hero-texto">
          <h1>
            Ações sustentáveis <span className="marca-lima">perto de você</span>
          </h1>
          <p>
            Compartilhe o que você faz pela sua cidade, descubra o que seus vizinhos estão fazendo e inspire mais gente a
            cuidar do lugar onde vive.
          </p>
          <div className="hero-acoes">
            <Link to="/explorar" className="btn btn-grande">
              Explorar publicações
            </Link>
            {status === 'ready' && !user && (
              <Link to="/cadastro" className="btn btn-lima btn-grande">
                Criar minha conta
              </Link>
            )}
            {user && (
              <Link to="/posts/novo" className="btn btn-lima btn-grande">
                Publicar uma ação
              </Link>
            )}
          </div>
        </div>
        <div className="hero-arte">
          <CenaDoBairro />
          <p className="selo">
            <strong>ODS 11</strong>
            <span>Cidades e comunidades sustentáveis</span>
          </p>
        </div>
      </section>

      <CategoriasEmMosaico />

      <PublicacoesRecentes />

      <section className="painel-numeros escuro" aria-labelledby="titulo-numeros">
        <h2 id="titulo-numeros">A comunidade em números</h2>
        <p className="subtitulo">Tudo o que as pessoas já compartilharam por aqui.</p>

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
        <Horizonte className="horizonte" />
      </section>

      {status === 'ready' && (
        <section className="faixa-convite" aria-labelledby="titulo-convite">
          <div>
            <h2 id="titulo-convite">{user ? 'Fez algo bom pela cidade?' : 'Tem uma ação sustentável para contar?'}</h2>
            <p>
              {user
                ? 'Conte para a comunidade e inspire mais gente.'
                : 'Crie a sua conta em um minuto e mostre o que você faz pelo lugar onde vive.'}
            </p>
          </div>
          <div className="acoes-form">
            {user ? (
              <Link to="/posts/novo" className="btn btn-grande">
                Publicar minha ação
              </Link>
            ) : (
              <>
                <Link to="/cadastro" className="btn btn-grande">
                  Criar minha conta
                </Link>
                <Link to="/entrar" className="btn btn-claro btn-grande">
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
