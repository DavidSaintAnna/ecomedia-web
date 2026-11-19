import { useEffect } from 'react';
import { useLocation } from 'react-router';

const PADRAO = 'EcoMedia';

/**
 * O título da aba do navegador acompanha o título (h1) da tela: "Ranking da comunidade · EcoMedia".
 * Leitores de tela leem esse título quando a pessoa troca de página, e ele aparece no histórico e nos favoritos.
 * Fica no Layout, então cada tela só precisa ter o seu h1 (inclusive "Página não encontrada").
 */
export function useTituloDaPagina() {
  const { pathname } = useLocation();

  useEffect(() => {
    const principal = document.getElementById('conteudo');
    if (!principal) return;
    const atualizar = () => {
      const h1 = principal.querySelector('h1')?.textContent?.trim();
      document.title = h1 ? `${h1} · ${PADRAO}` : PADRAO;
    };
    atualizar();
    const observador = new MutationObserver(atualizar);
    observador.observe(principal, { childList: true, subtree: true, characterData: true });
    return () => observador.disconnect();
  }, [pathname]);
}
