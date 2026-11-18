import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFeed } from '../api/hooks';
import { Paginacao } from '../components/Paginacao';
import { PostCard } from '../components/PostCard';
import { plural } from '../lib/format';

function lerPagina(valor: string | null): number {
  return valor && /^\d+$/.test(valor) && Number(valor) > 0 && Number.isSafeInteger(Number(valor)) ? Number(valor) : 1;
}

export function Feed() {
  const [params] = useSearchParams();
  const pagina = lerPagina(params.get('pagina'));
  const feed = useFeed(pagina);
  const resposta = feed.data;
  const para = (n: number) => ({ search: n > 1 ? `?pagina=${n}` : '' });

  const titulo = useRef<HTMLHeadingElement>(null);
  const anterior = useRef(pagina);
  useEffect(() => {
    if (anterior.current !== pagina) titulo.current?.focus();
    anterior.current = pagina;
  }, [pagina]);

  return (
    <>
      <h1>Seu feed</h1>
      <p className="subtitulo">As publicações de quem você segue, das mais novas para as mais antigas.</p>

      <section aria-labelledby="resultado" aria-busy={feed.isFetching}>
        <h2 id="resultado" tabIndex={-1} ref={titulo} className="resultado-titulo">
          {resposta ? plural(resposta.meta.total, 'publicação', 'publicações') : 'Publicações'}
        </h2>

        {feed.isPending && <p role="status">Carregando o feed…</p>}

        {feed.isError && (
          <div role="alert" className="aviso-erro">
            <p>{feed.error.message}</p>
            <button type="button" className="btn" onClick={() => void feed.refetch()}>
              Tentar de novo
            </button>
          </div>
        )}

        {resposta && resposta.data.length > 0 && (
          <>
            <div className={feed.isPlaceholderData ? 'lista-posts carregando' : 'lista-posts'}>
              {resposta.data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {resposta.meta.totalPages > 1 && (
              <Paginacao filtros={{ q: '', city: '', categoryId: '', page: pagina }} totalPages={resposta.meta.totalPages} para={para} />
            )}
          </>
        )}

        {resposta && resposta.data.length === 0 && resposta.meta.total > 0 && (
          <div className="vazio">
            <p>Esta página não existe: há só {plural(resposta.meta.totalPages, 'página', 'páginas')}.</p>
            <Link className="btn" to={para(1)}>
              Voltar à primeira página
            </Link>
          </div>
        )}

        {resposta && resposta.meta.total === 0 && (
          <div className="vazio">
            <p>Seu feed está vazio. Siga pessoas para ver aqui o que elas publicam, ou as publicações delas ainda não chegaram.</p>
            <Link className="btn" to="/explorar">
              Explorar publicações
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
