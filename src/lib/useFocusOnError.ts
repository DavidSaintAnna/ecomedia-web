import { useEffect, type RefObject } from 'react';

/** Depois de um envio com problema, leva o foco ao primeiro campo com erro (ou ao aviso do formulário). */
export function useFocusOnError(form: RefObject<HTMLFormElement | null>, erros: object, mensagem: string | null) {
  useEffect(() => {
    if (Object.keys(erros).length === 0 && !mensagem) return;
    const alvo =
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form.current?.querySelector<HTMLElement>('[role="alert"]');
    alvo?.focus();
  }, [form, erros, mensagem]);
}
