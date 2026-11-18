import { Link, useParams } from 'react-router';
import { usePost } from '../api/hooks';
import { Comentarios } from '../components/Comentarios';
import { PostCard } from '../components/PostCard';

function NaoEncontrado() {
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

export function PostPage() {
  const { id } = useParams();
  const postId = id && /^\d+$/.test(id) && Number(id) > 0 ? Number(id) : null; // a API responde 400 para id que não é número
  const post = usePost(postId);

  if (postId === null || (post.isError && post.error.status === 404)) return <NaoEncontrado />;

  return (
    <>
      <p>
        <Link to="/explorar">← Voltar para Explorar</Link>
      </p>

      {post.isPending && <p role="status">Carregando publicação…</p>}

      {post.isError && (
        <div role="alert" className="aviso-erro">
          <p>{post.error.message}</p>
          <button type="button" className="btn" onClick={() => void post.refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      {post.data && (
        <>
          <PostCard post={post.data} detalhe />
          <Comentarios post={post.data} />
        </>
      )}
    </>
  );
}
