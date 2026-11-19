import { Link } from 'react-router';
import { usePosts } from '../api/hooks';
import type { Post } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { IlustracaoCategoria } from '../ilustracoes/Categorias';
import { Avatar } from './Avatar';
import { Carrossel } from './Carrossel';

const TONS = ['lima', 'floresta', 'papel'] as const;
const QUANTAS = 8;

function Slide({ post, indice, total }: { post: Post; indice: number; total: number }) {
  return (
    <div className={`slide slide-${TONS[indice % TONS.length]}`} role="group" aria-roledescription="slide" aria-label={`${indice + 1} de ${total}`}>
      <span className="slide-arte" aria-hidden="true">
        <IlustracaoCategoria nome={post.category.name} />
      </span>
      <p className="slide-categoria">{post.category.name}</p>
      <p className="slide-texto">{post.content}</p>
      <div className="slide-rodape">
        <Avatar name={post.author.name} url={post.author.avatarUrl} />
        <span className="slide-autor">
          <strong>{post.author.name}</strong>
          {post.city && <span>{post.city}</span>}
        </span>
        <Link className="slide-link" to={`/posts/${post.id}`} aria-label={`Ler a publicação de ${post.author.name}`}>
          Ler
        </Link>
      </div>
    </div>
  );
}

// As publicações mais novas, uma por "slide". O carrossel só existe aqui, na página inicial.
export function PublicacoesRecentes() {
  const { user } = useAuth();
  const posts = usePosts({ page: 1, limit: QUANTAS });
  const titulo = 'Publicações mais recentes';
  const descricao = 'O que a comunidade acabou de compartilhar.';

  if (posts.isPending) {
    return (
      <section className="secao" aria-labelledby="titulo-recentes">
        <div className="secao-cabeca">
          <h2 id="titulo-recentes">{titulo}</h2>
        </div>
        <p role="status" className="so-leitor">
          Carregando publicações…
        </p>
        <div className="carrossel-pista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="esqueleto esqueleto-slide" />
          ))}
        </div>
      </section>
    );
  }

  if (posts.isError) {
    return (
      <section className="secao" aria-labelledby="titulo-recentes">
        <div className="secao-cabeca">
          <h2 id="titulo-recentes">{titulo}</h2>
        </div>
        <div role="alert" className="aviso-erro">
          <p>{posts.error.message}</p>
          <button type="button" className="btn" onClick={() => void posts.refetch()}>
            Tentar carregar as publicações de novo
          </button>
        </div>
      </section>
    );
  }

  const lista = posts.data.data;
  if (lista.length === 0) {
    return (
      <section className="secao" aria-labelledby="titulo-recentes">
        <div className="secao-cabeca">
          <h2 id="titulo-recentes">{titulo}</h2>
        </div>
        <div className="vazio">
          <p>Ainda não há publicações. A primeira pode ser a sua.</p>
          <Link to={user ? '/posts/novo' : '/cadastro'} className="btn">
            {user ? 'Publicar minha ação' : 'Criar minha conta'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <Carrossel titulo={titulo} descricao={descricao} rotuloAnterior="Publicações anteriores" rotuloProximo="Próximas publicações">
      {lista.map((post, i) => (
        <Slide key={post.id} post={post} indice={i} total={lista.length} />
      ))}
    </Carrossel>
  );
}
