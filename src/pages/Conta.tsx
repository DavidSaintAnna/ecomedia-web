import { useAuth } from '../auth/auth-context';
import { dataBR } from '../lib/dates';

// Versão inicial: só mostra os dados. Editar perfil e excluir conta chegam no dia 9.
export function Conta() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth já garante o login

  return (
    <section>
      <h1>Minha conta</h1>
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
    </section>
  );
}
