import { useEffect, useState } from 'react';

/** Vira true só depois de `ms` milissegundos com `active` ligado. Evita piscar avisos em respostas rápidas. */
export function useDelayedFlag(active: boolean, ms: number): boolean {
  const [passou, setPassou] = useState(false);

  useEffect(() => {
    if (!active) {
      setPassou(false);
      return;
    }
    const id = setTimeout(() => setPassou(true), ms);
    return () => clearTimeout(id);
  }, [active, ms]);

  return active && passou;
}
