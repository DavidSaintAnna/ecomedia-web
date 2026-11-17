import { useState } from 'react';
import type { Post } from '../api/types';
import { dataBR, quando } from '../lib/dates';
import { plural } from '../lib/format';
import { Avatar } from './Avatar';

// O link da imagem é digitado por quem publica e pode estar quebrado: sem a imagem, aparece um aviso.
function PostImage({ url, autor }: { url: string; autor: string }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return <div className="post-sem-imagem">Imagem indisponível</div>;
  return <img className="post-imagem" src={url} alt={`Foto enviada por ${autor}`} loading="lazy" onError={() => setFalhou(true)} />;
}

export function PostCard({ post }: { post: Post }) {
  const editado = Date.parse(post.updatedAt) - Date.parse(post.createdAt) > 60_000;

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
        <span>{plural(post.likesCount, 'curtida', 'curtidas')}</span>
        <span>{plural(post.commentsCount, 'comentário', 'comentários')}</span>
      </footer>
    </article>
  );
}
