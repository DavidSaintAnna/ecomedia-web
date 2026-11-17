// Filtros da tela Explorar. Eles moram no endereço (/explorar?categoryId=3&page=2) para que o link
// possa ser compartilhado, o botão Voltar funcione e o filtro sobreviva ao F5.

export interface ExplorarFiltros {
  q: string;
  city: string;
  categoryId: string;
  page: number;
}

function inteiroPositivo(valor: string | null): number | null {
  if (!valor || !/^\d+$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Lê o endereço com cuidado: valor estranho (page=abc, categoryId=0) vira "sem filtro", nunca um 400 da API. */
export function lerFiltros(params: URLSearchParams): ExplorarFiltros {
  return {
    q: (params.get('q') ?? '').trim(),
    city: (params.get('city') ?? '').trim(),
    categoryId: String(inteiroPositivo(params.get('categoryId')) ?? ''),
    page: inteiroPositivo(params.get('page')) ?? 1,
  };
}

/** Monta o endereço sem filtros vazios e sem page=1. */
export function paraParams(f: Partial<ExplorarFiltros>): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q?.trim()) params.set('q', f.q.trim());
  if (f.city?.trim()) params.set('city', f.city.trim());
  if (f.categoryId) params.set('categoryId', f.categoryId);
  if (f.page && f.page > 1) params.set('page', String(f.page));
  return params;
}

export function temFiltro(f: ExplorarFiltros): boolean {
  return Boolean(f.q || f.city || f.categoryId);
}
