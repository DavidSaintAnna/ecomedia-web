import { useState } from 'react';
import { Link } from 'react-router';
import type { Post } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { dataBR, quando } from '../lib/dates';
import { plural } from '../lib/format';
import { podeGerenciarPost } from '../lib/permissions';
import { AcoesDoPost } from './AcoesDoPost';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';

// O link da imagem é digitado por quem publica e pode estar quebrado: sem a imagem, aparece um aviso.
function PostImage({ url, autor }: { url: string; autor: string }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <div className="post-sem-imagem">Imagem indisponível</div>;
  // referrerPolicy: não conta aos sites das imagens de onde a pessoa chegou (e evita bloqueio por "hotlink")
  return (
    <img
      className="post-imagem"
      src={url}
      alt={`Foto enviada por ${autor}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
    />
  );
}

interface Props {
  post: Post;
  /** Na página do próprio post não há link "Ver publicação". */
  detalhe?: boolean;
  /** Depois que o autor ou o admin exclui a publicação por este cartão. */
  aoExcluir?: () => void;
}

export function PostCard({ post, detalhe = false, aoExcluir }: Props) {
  const { user } = useAuth();
  const editado = Date.parse(post.updatedAt) - Date.parse(post.createdAt) > 60_000;
  const comentarios = plural(post.commentsCount, 'comentário', 'comentários');

  return (
    <article className="post">
      <header className="post-topo">
        <Avatar name={post.author.name} url={post.author.avatarUrl} />
        <div>
          <p className="post-autor">{post.author.name}</p>
          <p className="post-meta">
            <time dateTime={post.createdAt} title={dataBR(post.createdAt)}>
              {quando(post.createdAt)}
            </time>
            {editado && ' · editado'}
            {post.city && ` · ${post.city}`}
          </p>
        </div>
      </header>

      <p className="post-categoria">{post.category.name}</p>
      <p className="post-texto">{post.content}</p>
      {post.imageUrl && <PostImage url={post.imageUrl} autor={post.author.name} />}

      <footer className="post-rodape">
        <LikeButton post={post} />
        {detalhe ? (
          <span>{comentarios}</span>
        ) : (
          <Link to={`/posts/${post.id}`} aria-label={`Ver publicação de ${post.author.name}: ${comentarios}`}>
            {comentarios}
          </Link>
        )}
      </footer>

      {podeGerenciarPost(user, post) && <AcoesDoPost post={post} aoExcluir={aoExcluir} />}
    </article>
  );
}
