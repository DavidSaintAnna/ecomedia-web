import { Link } from "react-router";
import { useAuth } from "../auth/auth-context";
import { Avatar } from "../components/Avatar";
import { EditarPerfil } from "../components/EditarPerfil";
import { ExcluirConta } from "../components/ExcluirConta";
import { dataBR } from "../lib/dates";

export function Conta() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth já garante o login

  return (
    <>
      <h1>Minha conta</h1>

      <div className="conta-grade">
        <section aria-labelledby="titulo-dados" className="bloco-conta">
          <h2 id="titulo-dados">Seus dados</h2>
          <div className="conta-resumo">
            <div className="conta-cabeca">
              <Avatar name={user.name} url={user.avatarUrl} grande />
              <div>
                <h2>{user.name}</h2>
                <p>
                  {user.role === "ADMIN" ? "Administrador" : "Pessoa comum"}
                </p>
              </div>
            </div>
            <dl className="dados">
              <div>
                <dt>E-mail</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Cidade</dt>
                <dd>{user.city ?? "Não informada"}</dd>
              </div>
              <div>
                <dt>Conta criada em</dt>
                <dd>{dataBR(user.createdAt)}</dd>
              </div>
            </dl>
            <p>
              <Link to={`/pessoas/${user.id}`}>Ver meu perfil público</Link>
            </p>
          </div>
        </section>

        <EditarPerfil key={`${user.id}`} user={user} />
      </div>
      <ExcluirConta user={user} />
    </>
  );
}
