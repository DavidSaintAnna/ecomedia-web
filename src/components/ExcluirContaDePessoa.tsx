import { useState } from "react";
import { useNavigate } from "react-router";
import { useDeleteUser } from "../api/hooks";
import type { Profile } from "../api/types";

/** Moderação: o administrador exclui a conta de outra pessoa (com tudo o que ela criou). Confirmação na própria tela. */
export function ExcluirContaDePessoa({ perfil }: { perfil: Profile }) {
  const navigate = useNavigate();
  const excluir = useDeleteUser(perfil.id);
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    excluir.mutate(undefined, {
      onSuccess: () =>
        navigate("/explorar", {
          state: { aviso: `A conta de ${perfil.name} foi excluída.` },
        }),
    });
  }

  return (
    <section
      aria-labelledby="titulo-moderar"
      className="bloco-conta zona-perigo moderacao"
    >
      <h2 id="titulo-moderar">Moderação</h2>
      <p>
        Como administrador, você pode excluir a conta de{" "}
        <strong>{perfil.name}</strong> e <strong>tudo o que ela criou</strong>:
        publicações, comentários e curtidas. Não dá para desfazer.
      </p>

      {!confirmando && (
        <button
          type="button"
          className="btn btn-claro btn-perigo"
          aria-label={`Excluir esta conta de ${perfil.name}`}
          onClick={() => setConfirmando(true)}
        >
          Excluir esta conta
        </button>
      )}

      {confirmando && (
        <div
          role="group"
          aria-label={`Confirmar exclusão da conta de ${perfil.name}`}
          className="confirmar confirmar-conta"
        >
          <p>Tem certeza? {consequencia(perfil)}</p>
          <button
            type="button"
            className="btn btn-perigo-cheio"
            disabled={excluir.isPending}
            onClick={confirmar}
          >
            {excluir.isPending ? "Excluindo…" : "Sim, excluir a conta"}
          </button>{" "}
          <button
            type="button"
            className="btn btn-claro"
            disabled={excluir.isPending}
            onClick={() => setConfirmando(false)}
          >
            Cancelar
          </button>
        </div>
      )}

      {excluir.isError && (
        <p role="alert" className="campo-erro">
          {excluir.error.message}
        </p>
      )}
    </section>
  );
}

function consequencia({
  name,
  postsCount,
}: Pick<Profile, "name" | "postsCount">): string {
  if (postsCount === 0)
    return `Os comentários e as curtidas de ${name} serão apagados.`;
  if (postsCount === 1)
    return `A publicação de ${name} será apagada, junto com os comentários e as curtidas.`;
  return `As ${postsCount} publicações de ${name} serão apagadas, junto com os comentários e as curtidas.`;
}
