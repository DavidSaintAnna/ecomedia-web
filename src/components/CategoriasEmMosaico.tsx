import { Link } from 'react-router';
import { useCategories } from '../api/hooks';
import type { Category } from '../api/types';
import { IlustracaoCategoria, PictogramaCategoria } from '../ilustracoes/Categorias';
import { SetaDiagonal } from '../ilustracoes/Icones';

function Bloco({ categoria }: { categoria: Category }) {
  return (
    <li className="categoria-tile">
      <h3>
        <Link className="categoria-tile-link" to={{ pathname: '/explorar', search: `?categoryId=${categoria.id}` }}>
          {categoria.name}
        </Link>
      </h3>
      {categoria.description && <p>{categoria.description}</p>}
      <span className="categoria-seta" aria-hidden="true">
        <SetaDiagonal />
      </span>
      <PictogramaCategoria nome={categoria.name} className="categoria-marca-dagua" />
      <span className="categoria-arte" aria-hidden="true">
        <IlustracaoCategoria nome={categoria.name} />
      </span>
    </li>
  );
}

// Uma "porta" por categoria, levando para Explorar já filtrado. Em telas com mouse o desenho aparece quando a pessoa
// passa o mouse (ou chega com o Tab); em telas de toque ele já fica à mostra.
export function CategoriasEmMosaico() {
  const categorias = useCategories();
  const titulo = (
    <div className="secao-cabeca">
      <div>
        <h2 id="titulo-categorias">Escolha uma categoria</h2>
        <p>Veja o que a comunidade está fazendo em cada assunto.</p>
      </div>
    </div>
  );

  if (categorias.isPending) {
    return (
      <section className="secao" aria-labelledby="titulo-categorias">
        {titulo}
        <p role="status" className="so-leitor">
          Carregando categorias…
        </p>
        <div className="categorias" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="esqueleto" />
          ))}
        </div>
      </section>
    );
  }

  if (categorias.isError) {
    return (
      <section className="secao" aria-labelledby="titulo-categorias">
        {titulo}
        <div role="alert" className="aviso-erro">
          <p>{categorias.error.message}</p>
          <button type="button" className="btn" onClick={() => void categorias.refetch()}>
            Tentar carregar as categorias de novo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="secao" aria-labelledby="titulo-categorias">
      {titulo}
      <ul className="categorias">
        {categorias.data.map((c) => (
          <Bloco key={c.id} categoria={c} />
        ))}
        <li className="categoria-tile categoria-tile-tudo">
          <h3>
            <Link className="categoria-tile-link" to="/explorar">
              Ver todas as publicações
            </Link>
          </h3>
          <p>Sem filtro: tudo o que já foi compartilhado.</p>
          <span className="categoria-seta" aria-hidden="true">
            <SetaDiagonal />
          </span>
        </li>
      </ul>
    </section>
  );
}
