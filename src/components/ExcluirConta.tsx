import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDeleteAccount } from '../api/hooks';
import type { AuthUser } from '../api/types';

export function ExcluirConta({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const excluir = useDeleteAccount();
  const [confirmando, setConfirmando] = useState(false);

  function confirmar() {
    excluir.mutate(undefined, {
      // Vai para o início pedindo para encerrar a sessão lá (o Layout faz): sair daqui antes mandaria para /entrar.
      onSuccess: () => navigate('/', { state: { sair: true, aviso: 'Sua conta foi excluída. Sentiremos sua falta!' } }),
    });
  }

  return (
    <section aria-labelledby="titulo-excluir" className="bloco-conta zona-perigo">
      <h2 id="titulo-excluir">Excluir minha conta</h2>
      <p>
        Isso apaga a sua conta e <strong>tudo o que você criou</strong>: publicações, comentários, curtidas e quem você segue ou te segue. Não dá para desfazer.
        {user.role === 'ADMIN' && ' O único administrador não pode excluir a própria conta.'}
      </p>

      {!confirmando && (
        <button type="button" className="btn btn-claro btn-perigo" onClick={() => setConfirmando(true)}>
          Excluir minha conta
        </button>
      )}

      {confirmando && (
        <div role="group" aria-label="Confirmar exclusão da conta" className="confirmar confirmar-conta">
          <p>Tem certeza? Todas as suas publicações e comentários serão apagados.</p>
          <button type="button" className="btn btn-perigo-cheio" disabled={excluir.isPending} onClick={confirmar}>
            {excluir.isPending ? 'Excluindo…' : 'Sim, excluir minha conta'}
          </button>{' '}
          <button type="button" className="btn btn-claro" disabled={excluir.isPending} onClick={() => setConfirmando(false)}>
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
