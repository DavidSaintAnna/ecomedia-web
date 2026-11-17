/** Depois de entrar, volta para a tela que a pessoa tentou abrir (guardada em state.from); senão, o início. */
export function destinoDepoisDeEntrar(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return '/';
  if (from.startsWith('/entrar') || from.startsWith('/cadastro')) return '/';
  return from;
}
