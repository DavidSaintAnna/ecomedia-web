import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useCategories, usePosts } from '../api/hooks';
import { FiltrosPosts } from '../components/FiltrosPosts';
import { Paginacao } from '../components/Paginacao';
import { PostCard } from '../components/PostCard';
import { lerFiltros, paraParams, temFiltro } from '../lib/filters';
import { plural } from '../lib/format';

const POR_PAGINA = 10;

export function Explorar() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Aviso vindo de outra tela (por exemplo "Publicação excluída."). Guardado em estado e tirado do histórico,
  // para não reaparecer ao atualizar a página.
  const [aviso, setAviso] = useState(() => (location.state as { aviso?: string } | null)?.aviso);
  useEffect(() => {
    if (aviso) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // roda só uma vez, ao abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const filtros = lerFiltros(params);
  const categorias = useCategories();
  const posts = usePosts({
    q: filtros.q || undefined,
    city: filtros.city || undefined,
    categoryId: filtros.categoryId ? Number(filtros.categoryId) : undefined,
    page: filtros.page,
    limit: POR_PAGINA,
  });

  // Ao trocar de página, leva o foco ao título do resultado: leitores de tela anunciam a mudança e a tela sobe.
  const titulo = useRef<HTMLHeadingElement>(null);
  const paginaAnterior = useRef(filtros.page);
  useEffect(() => {
    if (paginaAnterior.current !== filtros.page) titulo.current?.focus();
    paginaAnterior.current = filtros.page;
  }, [filtros.page]);

  const ativo = temFiltro(filtros);
  const resposta = posts.data;
  const chaveFiltros = `${filtros.q}|${filtros.city}|${filtros.categoryId}`;

  return (
    <>
      <h1>Explorar publicações</h1>

      {aviso && (
        <p role="status" className="aviso">
          {aviso}
        </p>
      )}

      <FiltrosPosts
        key={chaveFiltros}
        inicial={filtros}
        categorias={categorias.data ?? []}
        categoriasCarregando={categorias.isPending}
        temFiltro={ativo}
        onAplicar={(valores) => setParams(paraParams({ ...valores, page: 1 }))}
        onLimpar={() => setParams(new URLSearchParams())}
      />

      <section aria-labelledby="resultado" aria-busy={posts.isFetching}>
        <h2 id="resultado" tabIndex={-1} ref={titulo} className="resultado-titulo">
          {resposta
            ? ativo
              ? `${plural(resposta.meta.total, 'publicação encontrada', 'publicações encontradas')}`
              : plural(resposta.meta.total, 'publicação', 'publicações')
            : 'Publicações'}
        </h2>

        {posts.isPending && <p role="status">Carregando publicações…</p>}

        {posts.isError && (
          <div role="alert" className="aviso-erro">
            <p>{posts.error.message}</p>
            <button type="button" className="btn" onClick={() => void posts.refetch()}>
              Tentar de novo
            </button>
          </div>
        )}

        {resposta && resposta.data.length > 0 && (
          <>
            <div className={posts.isPlaceholderData ? 'lista-posts carregando' : 'lista-posts'}>
              {resposta.data.map((post) => (
                <PostCard key={post.id} post={post} aoExcluir={() => setAviso('Publicação excluída.')} />
              ))}
            </div>
            {resposta.meta.totalPages > 1 && <Paginacao filtros={filtros} totalPages={resposta.meta.totalPages} />}
          </>
        )}

        {resposta && resposta.data.length === 0 && resposta.meta.total > 0 && (
          <div className="vazio">
            <p>Esta página não existe: há só {plural(resposta.meta.totalPages, 'página', 'páginas')}.</p>
            <Link className="btn" to={{ search: `?${paraParams({ ...filtros, page: 1 }).toString()}` }}>
              Voltar à primeira página
            </Link>
          </div>
        )}

        {resposta && resposta.meta.total === 0 && (
          <div className="vazio">
            {ativo ? (
              <p>Nenhuma publicação encontrada com esses filtros. Tente outras palavras ou use Limpar filtros.</p>
            ) : (
              <p>Ainda não há publicações. Quando alguém publicar, elas aparecem aqui.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
