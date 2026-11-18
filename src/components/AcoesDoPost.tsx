import { useState } from 'react';
import { Link } from 'react-router';
import { useDeletePost } from '../api/hooks';
import type { Post } from '../api/types';

interface Props {
  post: Post;
  /** Chamado depois que a API confirmou a exclusão (para a tela avisar e seguir). */
  aoExcluir?: () => void;
}

/** "Editar" e "Excluir" (com confirmação na própria tela, sem janela do navegador). Só para o autor ou o admin. */
export function AcoesDoPost({ post, aoExcluir }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const excluir = useDeletePost(post.id);

  return (
    <div className="acoes-post">
      {!confirmando && (
        <>
          <Link to={`/posts/${post.id}/editar`} className="btn btn-claro btn-pequeno" aria-label={`Editar publicação de ${post.author.name}`}>
            Editar
          </Link>
          <button
            type="button"
            className="btn btn-claro btn-pequeno btn-perigo"
            aria-label={`Excluir publicação de ${post.author.name}`}
            onClick={() => setConfirmando(true)}
          >
            Excluir
          </button>
        </>
      )}
      {confirmando && (
        <div role="group" aria-label="Confirmar exclusão da publicação" className="confirmar">
          <p>Excluir esta publicação? Os comentários e as curtidas dela também somem. Isso não pode ser desfeito.</p>
          <button
            type="button"
            className="btn btn-pequeno btn-perigo-cheio"
            disabled={excluir.isPending}
            onClick={() => excluir.mutate(undefined, { onSuccess: () => aoExcluir?.() })}
          >
            {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
          </button>{' '}
          <button type="button" className="btn btn-claro btn-pequeno" disabled={excluir.isPending} onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </div>
      )}
      {excluir.isError && (
        <p role="alert" className="campo-erro">
          {excluir.error.message}
        </p>
      )}
    </div>
  );
}
