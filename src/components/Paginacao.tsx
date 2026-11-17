import { Link } from 'react-router';
import type { ExplorarFiltros } from '../lib/filters';
import { paraParams } from '../lib/filters';

interface Props {
  filtros: ExplorarFiltros;
  totalPages: number;
}

// Links de verdade (não botões): dá para abrir a página em outra aba e o endereço fica compartilhável.
export function Paginacao({ filtros, totalPages }: Props) {
  const pagina = Math.min(filtros.page, totalPages);
  const para = (n: number) => ({ search: `?${paraParams({ ...filtros, page: n }).toString()}` });

  return (
    <nav className="paginacao" aria-label="Paginação">
      {pagina > 1 ? (
        <Link to={para(pagina - 1)} rel="prev">
          ← Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className="paginacao-inativo">
          ← Anterior
        </span>
      )}
      <span aria-current="page">
        Página {pagina} de {totalPages}
      </span>
      {pagina < totalPages ? (
        <Link to={para(pagina + 1)} rel="next">
          Próxima →
        </Link>
      ) : (
        <span aria-disabled="true" className="paginacao-inativo">
          Próxima →
        </span>
      )}
    </nav>
  );
}
