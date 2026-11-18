import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { usePost } from '../api/hooks';
import { Comentarios } from '../components/Comentarios';
import { NaoEncontrado } from '../components/NaoEncontrado';
import { PostCard } from '../components/PostCard';

export function PostPage() {
  const { id } = useParams();
  const postId = id && /^\d+$/.test(id) && Number(id) > 0 ? Number(id) : null; // a API responde 400 para id que não é número
  const navigate = useNavigate();
  const [excluida, setExcluida] = useState(false);
  // depois de excluir, para de buscar: a API responderia 404 e a tela trocaria para "não encontrada"
  const post = usePost(excluida ? null : postId);

  if (excluida) return <p role="status">Publicação excluída. Voltando…</p>;
  if (postId === null || (post.isError && post.error.status === 404)) return <NaoEncontrado />;

  function depoisDeExcluir() {
    setExcluida(true);
    navigate('/explorar', { state: { aviso: 'Publicação excluída.' } });
  }

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
          <PostCard post={post.data} detalhe aoExcluir={depoisDeExcluir} />
          <Comentarios post={post.data} />
        </>
      )}
    </>
  );
}
