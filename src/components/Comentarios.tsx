import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { useAddComment, useComments, useDeleteComment } from '../api/hooks';
import { ApiError } from '../api/client';
import type { Comment, Post } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { dataBR, quando } from '../lib/dates';
import { plural } from '../lib/format';
import { useFocusOnError } from '../lib/useFocusOnError';
import { errosDaApi } from '../lib/validation';
import { Avatar } from './Avatar';
import { TextArea } from './TextArea';

const MAXIMO = 500;

function ComentarioItem({ comentario, postId }: { comentario: Comment; postId: number }) {
  const { user } = useAuth();
  const excluir = useDeleteComment(postId);
  const [confirmando, setConfirmando] = useState(false);
  const pode = user && (user.role === 'ADMIN' || user.id === comentario.author.id);

  return (
    <li className="comentario">
      <Avatar name={comentario.author.name} url={comentario.author.avatarUrl} />
      <div className="comentario-corpo">
        <p className="comentario-autor">
          <strong>{comentario.author.name}</strong>{' '}
          <time dateTime={comentario.createdAt} title={dataBR(comentario.createdAt)}>
            {quando(comentario.createdAt)}
          </time>
        </p>
        <p className="comentario-texto">{comentario.content}</p>

        {pode && !confirmando && (
          <button type="button" className="link-botao" onClick={() => setConfirmando(true)}>
            Excluir
          </button>
        )}
        {pode && confirmando && (
          <span className="confirmar" role="group" aria-label="Confirmar exclusão do comentário">
            Excluir este comentário?{' '}
            <button
              type="button"
              className="link-botao perigo"
              disabled={excluir.isPending}
              onClick={() => excluir.mutate(comentario.id, { onSettled: () => setConfirmando(false) })}
            >
              Sim, excluir
            </button>{' '}
            <button type="button" className="link-botao" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </span>
        )}
        {excluir.isError && (
          <p role="alert" className="campo-erro">
            {excluir.error.message}
          </p>
        )}
      </div>
    </li>
  );
}

function NovoComentario({ postId }: { postId: number }) {
  const adicionar = useAddComment(postId);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [publicado, setPublicado] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erro ? { content: erro } : {}, null);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (adicionar.isPending) return;
    const conteudo = texto.trim();
    setPublicado(false);
    if (!conteudo) return setErro('Escreva alguma coisa antes de enviar.');
    if (conteudo.length > MAXIMO) return setErro(`O comentário pode ter no máximo ${MAXIMO} caracteres.`);
    setErro(undefined);
    adicionar.mutate(conteudo, {
      onSuccess: () => {
        setTexto('');
        setPublicado(true);
      },
      onError: (e) => {
        const porCampo = e instanceof ApiError ? errosDaApi(e, ['content']) : {};
        setErro(porCampo.content ?? (e instanceof Error ? e.message : 'Não foi possível comentar.'));
      },
    });
  }

  return (
    <form ref={formRef} onSubmit={enviar} noValidate className="novo-comentario">
      <TextArea
        label="Escreva um comentário"
        name="content"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        error={erro}
        contador={{ atual: texto.length, maximo: MAXIMO }}
      />
      <button type="submit" className="btn" disabled={adicionar.isPending}>
        {adicionar.isPending ? 'Enviando…' : 'Comentar'}
      </button>
      {publicado && (
        <p role="status" className="sucesso">
          Comentário publicado.
        </p>
      )}
    </form>
  );
}

export function Comentarios({ post }: { post: Post }) {
  const { user } = useAuth();
  const location = useLocation();
  const comentarios = useComments(post.id);
  const lista = comentarios.data?.pages.flatMap((pagina) => pagina.data) ?? [];

  return (
    <section aria-labelledby="comentarios" className="comentarios">
      <h2 id="comentarios">{plural(post.commentsCount, 'comentário', 'comentários')}</h2>

      {comentarios.isPending && <p role="status">Carregando comentários…</p>}

      {comentarios.isError && (
        <div role="alert" className="aviso-erro">
          <p>{comentarios.error.message}</p>
          <button type="button" className="btn" onClick={() => void comentarios.refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      {comentarios.data && lista.length === 0 && <p className="dica-vazio">Ainda não há comentários. Seja a primeira pessoa!</p>}

      {lista.length > 0 && (
        <ol className="lista-comentarios">
          {lista.map((c) => (
            <ComentarioItem key={c.id} comentario={c} postId={post.id} />
          ))}
        </ol>
      )}

      {comentarios.hasNextPage && (
        <button type="button" className="btn btn-claro" disabled={comentarios.isFetchingNextPage} onClick={() => void comentarios.fetchNextPage()}>
          {comentarios.isFetchingNextPage ? 'Carregando…' : 'Carregar mais comentários'}
        </button>
      )}

      {user ? (
        <NovoComentario postId={post.id} />
      ) : (
        <p className="convite">
          <Link to="/entrar" state={{ from: location.pathname }}>
            Entre
          </Link>{' '}
          ou{' '}
          <Link to="/cadastro" state={{ from: location.pathname }}>
            crie uma conta
          </Link>{' '}
          para comentar.
        </p>
      )}
    </section>
  );
}
