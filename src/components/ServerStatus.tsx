import { useHealth } from '../api/hooks';
import { useDelayedFlag } from '../lib/useDelayedFlag';

// A API gratuita do Render dorme depois de 15 min parada e leva cerca de 1 min para acordar.
// Este aviso evita que a pessoa ache que o site quebrou. Se a API não responder de vez, cada tela
// mostra o seu próprio erro com o botão "Tentar de novo".
export function ServerStatus() {
  const health = useHealth();
  const demorando = useDelayedFlag(health.isPending, 3000);

  if (demorando) {
    return (
      <div className="banner" role="status">
        Acordando o servidor… pode levar até 1 minuto na primeira visita.
      </div>
    );
  }

  return null;
}
