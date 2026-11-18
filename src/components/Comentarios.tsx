import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { useAddComment, useComments, useDeleteComment, useEditComment } from '../api/hooks';
import { ApiError } from '../api/client';
import type { Comment, Post } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { dataBR, quando } from '../lib/dates';
import { plural } from '../lib/format';
import { useFocusOnError } from '../lib/useFocusOnError';
import { COMENTARIO_MAXIMO, COMENTARIO_MINIMO, errosDaApi, validarComentario } from '../lib/validation';
import { Avatar } from './Avatar';
import { TextArea } from './TextArea';

function ComentarioItem({ comentario, postId }: { comentario: Comment; postId: number }) {
  const { user } = useAuth();
  const excluir = useDeleteComment(postId);
  const editar = useEditComment(postId);
  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(comentario.content);
  const [erro, setErro] = useState<string | undefined>();
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, erro ? { content: erro } : {}, null);
  const doAutor = !!user && user.id === comentario.author.id;
  const pode = !!user && (user.role === 'ADMIN' || doAutor); // excluir: autor ou admin
  // editar: só o autor (o admin pode excluir, mas não reescrever o que outra pessoa disse)

  function comecarEdicao() {
    setTexto(comentario.content);
    setErro(undefined);
    editar.reset();
    setConfirmando(false);
    setEditando(true);
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (editar.isPending) return;
    const problema = validarComentario(texto);
    if (problema) return setErro(problema);
    const novo = texto.trim();
    if (novo === comentario.content) return setEditando(false); // nada mudou: não precisa chamar a API
    setErro(undefined);
    editar.mutate(
      { id: comentario.id, content: novo },
      {
        onSuccess: () => setEditando(false),
        onError: (e) => {
          const porCampo = e instanceof ApiError ? errosDaApi(e, ['content']) : {};
          setErro(porCampo.content ?? (e instanceof Error ? e.message : 'Não foi possível salvar.'));
        },
      },
    );
  }

  return (
    <li className="comentario">
      <Avatar name={comentario.author.name} url={comentario.author.avatarUrl} />
      <div className="comentario-corpo">
        <p className="comentario-autor">
          <strong>{comentario.author.name}</strong>{' '}
          <time dateTime={comentario.createdAt} title={dataBR(comentario.createdAt)}>
            {quando(comentario.createdAt)}
          </time>
          {comentario.editedAt && (
            <span title={`Editado em ${dataBR(comentario.editedAt)}`}> · editado</span>
          )}
        </p>

        {!editando && <p className="comentario-texto">{comentario.content}</p>}

        {editando && (
          <form ref={formRef} onSubmit={salvar} noValidate className="editar-comentario">
            <TextArea
              label="Editar comentário"
              name="content"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErro(undefined);
              }}
              error={erro}
              contador={{ atual: texto.length, maximo: COMENTARIO_MAXIMO, minimo: COMENTARIO_MINIMO }}
              autoFocus
            />
            <button type="submit" className="btn btn-pequeno" disabled={editar.isPending}>
              {editar.isPending ? 'Salvando…' : 'Salvar'}
            </button>{' '}
            <button type="button" className="btn btn-claro btn-pequeno" disabled={editar.isPending} onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </form>
        )}

        {!editando && !confirmando && (
          <span className="acoes-comentario">
            {doAutor && (
              <button type="button" className="link-botao" onClick={comecarEdicao}>
                Editar
              </button>
            )}
            {pode && (
              <button type="button" className="link-botao" onClick={() => setConfirmando(true)}>
                Excluir
              </button>
            )}
          </span>
        )}
        {!editando && pode && confirmando && (
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
    const problema = validarComentario(texto);
    if (problema) return setErro(problema);
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
        onChange={(e) => {
          setTexto(e.target.value);
          setErro(undefined);
        }}
        error={erro}
        contador={{ atual: texto.length, maximo: COMENTARIO_MAXIMO, minimo: COMENTARIO_MINIMO }}
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
