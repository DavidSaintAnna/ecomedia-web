import { Link, useNavigate, useParams } from 'react-router';
import { useUpdatePost, usePost } from '../api/hooks';
import { useAuth } from '../auth/auth-context';
import { NaoEncontrado } from '../components/NaoEncontrado';
import { PostForm } from '../components/PostForm';
import { podeGerenciarPost } from '../lib/permissions';
import { corpoEdicao, valoresIniciais } from '../lib/postBody';

export function EditarPost() {
  const { id } = useParams();
  const postId = id && /^\d+$/.test(id) && Number(id) > 0 ? Number(id) : null;
  const { user } = useAuth();
  const post = usePost(postId);
  const editar = useUpdatePost(postId ?? 0);
  const navigate = useNavigate();

  if (postId === null || (post.isError && post.error.status === 404)) return <NaoEncontrado />;
  if (post.isPending) return <p role="status">Carregando publicação…</p>;
  if (post.isError) {
    return (
      <div role="alert" className="aviso-erro">
        <p>{post.error.message}</p>
        <button type="button" className="btn" onClick={() => void post.refetch()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const original = post.data;
  if (!podeGerenciarPost(user, original)) {
    return (
      <section className="hero">
        <h1>Editar publicação</h1>
        <p role="alert">Você só pode editar as suas próprias publicações.</p>
        <Link to={`/posts/${original.id}`} className="btn">
          Voltar para a publicação
        </Link>
      </section>
    );
  }

  return (
    <PostForm
      titulo="Editar publicação"
      inicial={valoresIniciais(original)}
      rotuloEnviar="Salvar alterações"
      rotuloEnviando="Salvando…"
      voltarPara={`/posts/${original.id}`}
      onEnviar={async (valores) => {
        const corpo = corpoEdicao(original, valores);
        if (Object.keys(corpo).length === 0) throw new Error('Você não alterou nada.');
        await editar.mutateAsync(corpo);
        navigate(`/posts/${original.id}`);
      }}
    />
  );
}
