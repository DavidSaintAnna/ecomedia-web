import { Link, useLocation } from 'react-router';
import { useToggleFollow } from '../api/hooks';
import type { Profile } from '../api/types';
import { useAuth } from '../auth/auth-context';

// Seguir e deixar de seguir são o mesmo botão. Enquanto a API responde ele fica desligado: dois cliques rápidos
// desfariam o primeiro, porque cada POST liga ou desliga.
export function BotaoSeguir({ perfil }: { perfil: Profile }) {
  const { user } = useAuth();
  const location = useLocation();
  const alternar = useToggleFollow(perfil.id, user?.id);

  if (!user) {
    return (
      <Link className="btn btn-claro" to="/entrar" state={{ from: location.pathname + location.search }}>
        Entre para seguir
      </Link>
    );
  }

  if (user.id === perfil.id) {
    return (
      <Link className="btn btn-claro" to="/conta">
        Minha conta
      </Link>
    );
  }

  const texto = perfil.followedByMe ? 'Deixar de seguir' : 'Seguir';
  return (
    <div className="seguir-grupo">
      <button
        type="button"
        className={perfil.followedByMe ? 'btn btn-claro' : 'btn'}
        aria-label={`${texto} ${perfil.name}`}
        disabled={alternar.isPending}
        onClick={() => alternar.mutate({ followedByMe: perfil.followedByMe, followersCount: perfil.followersCount })}
      >
        {texto}
      </button>
      {alternar.isError && (
        <p role="alert" className="campo-erro">
          {alternar.error.message}
        </p>
      )}
    </div>
  );
}
