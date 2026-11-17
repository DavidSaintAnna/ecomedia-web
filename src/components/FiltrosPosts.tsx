import { useState, type FormEvent } from 'react';
import type { Category } from '../api/types';
import type { ExplorarFiltros } from '../lib/filters';
import { Field } from './Field';

interface Props {
  inicial: ExplorarFiltros;
  categorias: Category[];
  categoriasCarregando: boolean;
  temFiltro: boolean;
  onAplicar: (valores: Pick<ExplorarFiltros, 'q' | 'city' | 'categoryId'>) => void;
  onLimpar: () => void;
}

// O pai usa `key` com os filtros do endereço: quando o endereço muda (Voltar, Limpar), o formulário recomeça dele.
export function FiltrosPosts({ inicial, categorias, categoriasCarregando, temFiltro, onAplicar, onLimpar }: Props) {
  const [q, setQ] = useState(inicial.q);
  const [city, setCity] = useState(inicial.city);
  const [categoryId, setCategoryId] = useState(inicial.categoryId);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    onAplicar({ q, city, categoryId });
  }

  return (
    <form className="filtros" onSubmit={enviar} role="search" aria-label="Filtrar publicações">
      <Field label="Buscar no texto" type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} />
      <Field label="Cidade" type="search" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
      <div className="campo">
        <label htmlFor="filtro-categoria">Categoria</label>
        <select
          id="filtro-categoria"
          value={categoryId}
          disabled={categoriasCarregando}
          onChange={(e) => {
            setCategoryId(e.target.value);
            onAplicar({ q, city, categoryId: e.target.value });
          }}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filtros-acoes">
        <button type="submit" className="btn">
          Buscar
        </button>
        {temFiltro && (
          <button type="button" className="btn btn-claro" onClick={onLimpar}>
            Limpar filtros
          </button>
        )}
      </div>
    </form>
  );
}
