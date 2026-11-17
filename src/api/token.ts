// O token fica no localStorage. Tudo em try/catch porque o navegador pode bloquear o acesso
// (janela anônima restrita, dados do site bloqueados): nesse caso o site funciona sem guardar login.
const CHAVE = 'ecomedia.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(CHAVE, token);
    } catch {
      /* sem armazenamento: a pessoa precisará entrar de novo ao recarregar */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* nada a limpar */
    }
  },
};
