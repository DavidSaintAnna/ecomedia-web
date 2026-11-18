import { Link, useLocation } from 'react-router';
import { useToggleLike } from '../api/hooks';
import type { Post } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { plural } from '../lib/format';

// Curtir e descurtir são o mesmo botão. Enquanto a API responde ele fica desligado: dois cliques rápidos
// desfariam o primeiro, porque cada POST liga ou desliga.
export function LikeButton({ post }: { post: Post }) {
  const { user } = useAuth();
  const location = useLocation();
  const alternar = useToggleLike();
  const contagem = (
    <span className="curtidas-total" aria-live="polite">
      {plural(post.likesCount, 'curtida', 'curtidas')}
    </span>
  );

  if (!user) {
    return (
      <span className="curtir-grupo">
        <Link
          className="curtir"
          to="/entrar"
          state={{ from: location.pathname + location.search }}
          aria-label={`Entre para curtir a publicação de ${post.author.name}`}
        >
          <span aria-hidden="true">♡</span> Curtir
        </Link>
        {contagem}
      </span>
    );
  }

  return (
    <span className="curtir-grupo">
      <button
        type="button"
        className={post.likedByMe ? 'curtir curtido' : 'curtir'}
        aria-pressed={post.likedByMe}
        disabled={alternar.isPending}
        onClick={() => alternar.mutate({ id: post.id, likedByMe: post.likedByMe, likesCount: post.likesCount })}
      >
        <span aria-hidden="true">{post.likedByMe ? '♥' : '♡'}</span> Curtir
      </button>
      {contagem}
      {alternar.isError && (
        <span role="alert" className="curtir-erro">
          {alternar.error.message}
        </span>
      )}
    </span>
  );
}
