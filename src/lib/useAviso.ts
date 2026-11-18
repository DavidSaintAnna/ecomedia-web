import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Aviso vindo de outra tela (por exemplo "Publicação excluída."): quem navega manda `state: { aviso }`.
 * Fica guardado em estado e sai do histórico, para não reaparecer ao atualizar a página.
 */
export function useAviso() {
  const location = useLocation();
  const navigate = useNavigate();
  const vindoDoEndereco = (location.state as { aviso?: string } | null)?.aviso;
  const [aviso, setAviso] = useState<string | undefined>(vindoDoEndereco);

  useEffect(() => {
    if (!vindoDoEndereco) return;
    setAviso(vindoDoEndereco);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [vindoDoEndereco, location.pathname, location.search, navigate]);

  return [aviso, setAviso] as const;
}
