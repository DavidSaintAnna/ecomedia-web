import { Link } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { Avatar } from '../components/Avatar';
import { EditarPerfil } from '../components/EditarPerfil';
import { ExcluirConta } from '../components/ExcluirConta';
import { dataBR } from '../lib/dates';

export function Conta() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth já garante o login

  return (
    <>
      <h1>Minha conta</h1>

      <section aria-label="Dados da conta" className="conta-resumo">
        <Avatar name={user.name} url={user.avatarUrl} grande />
        <dl className="dados">
          <div>
            <dt>Nome</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Cidade</dt>
            <dd>{user.city ?? 'Não informada'}</dd>
          </div>
          <div>
            <dt>Tipo de conta</dt>
            <dd>{user.role === 'ADMIN' ? 'Administrador' : 'Pessoa comum'}</dd>
          </div>
          <div>
            <dt>Conta criada em</dt>
            <dd>{dataBR(user.createdAt)}</dd>
          </div>
        </dl>
        <p>
          <Link to={`/pessoas/${user.id}`}>Ver meu perfil público</Link>
        </p>
      </section>

      <EditarPerfil key={`${user.id}`} user={user} />
      <ExcluirConta user={user} />
    </>
  );
}
