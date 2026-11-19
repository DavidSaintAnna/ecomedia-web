import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { usePessoas, usePosts, useProfile, type ListaDePessoas as TipoDeLista } from '../api/hooks';
import type { Profile } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { Avatar } from '../components/Avatar';
import { BotaoSeguir } from '../components/BotaoSeguir';
import { ExcluirContaDePessoa } from '../components/ExcluirContaDePessoa';
import { ListaDePessoas } from '../components/ListaDePessoas';
import { Paginacao } from '../components/Paginacao';
import { PostCard } from '../components/PostCard';
import { mesAno } from '../lib/dates';
import { ehAdmin } from '../lib/permissions';
import { plural } from '../lib/format';

type Aba = 'publicacoes' | TipoDeLista;
const POR_PAGINA = 10;

function lerAba(valor: string | null): Aba {
  return valor === 'seguidores' ? 'followers' : valor === 'seguindo' ? 'following' : 'publicacoes';
}
const nomeNaUrl = (aba: Aba) => (aba === 'followers' ? 'seguidores' : aba === 'following' ? 'seguindo' : null);

function lerPagina(valor: string | null): number {
  return valor && /^\d+$/.test(valor) && Number(valor) > 0 && Number.isSafeInteger(Number(valor)) ? Number(valor) : 1;
}

function NaoEncontrada() {
  return (
    <section className="hero">
      <h1>Pessoa não encontrada</h1>
      <p>Esta conta pode ter sido excluída, ou o endereço está errado.</p>
      <Link to="/explorar" className="btn">
        Ver publicações
      </Link>
    </section>
  );
}

function Estado({ query, vazio }: { query: { isPending: boolean; isError: boolean; error: Error | null; refetch: () => unknown }; vazio?: string }) {
  if (query.isPending) return <p role="status">Carregando…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="aviso-erro">
        <p>{query.error?.message}</p>
        <button type="button" className="btn" onClick={() => void query.refetch()}>
          Tentar de novo
        </button>
      </div>
    );
  }
  return vazio ? (
    <div className="vazio">
      <p>{vazio}</p>
    </div>
  ) : null;
}

function Cabecalho({ perfil }: { perfil: Profile }) {
  return (
    <header className="perfil-topo">
      <Avatar name={perfil.name} url={perfil.avatarUrl} grande />
      <div className="perfil-info">
        <h1 tabIndex={-1}>{perfil.name}</h1>
        <p className="post-meta">
          {perfil.city ? `${perfil.city} · ` : ''}Na EcoMedia desde {mesAno(perfil.createdAt)}
        </p>
        {perfil.bio && <p className="perfil-bio">{perfil.bio}</p>}
      </div>
      <div className="perfil-acao">
        <BotaoSeguir perfil={perfil} />
      </div>
    </header>
  );
}

export function Pessoa() {
  const { id } = useParams();
  const personId = id && /^\d+$/.test(id) && Number(id) > 0 && Number.isSafeInteger(Number(id)) ? Number(id) : null;
  const { user } = useAuth();
  const [params] = useSearchParams();
  const aba = lerAba(params.get('aba'));
  const pagina = lerPagina(params.get('pagina'));

  const perfil = useProfile(personId);
  // só busca as publicações com um id válido e na aba delas (sem id, a API devolveria as de todo mundo)
  const posts = usePosts({ authorId: personId ?? undefined, page: pagina, limit: POR_PAGINA }, personId !== null && aba === 'publicacoes');
  const pessoas = usePessoas(personId, aba === 'publicacoes' ? 'followers' : aba, pagina, aba !== 'publicacoes');
  const postsAtivos = aba === 'publicacoes';

  // Ao abrir outra pessoa ou trocar de aba/página, o foco vai para o título da seção (leitores de tela anunciam).
  const titulo = useRef<HTMLHeadingElement>(null);
  const anterior = useRef(`${aba}|${pagina}`);
  useEffect(() => {
    const atual = `${aba}|${pagina}`;
    if (anterior.current !== atual) titulo.current?.focus();
    anterior.current = atual;
  }, [aba, pagina]);

  if (personId === null || (perfil.isError && perfil.error.status === 404)) return <NaoEncontrada />;
  if (perfil.isPending) return <p role="status">Carregando perfil…</p>;
  if (perfil.isError) {
    return (
      <div role="alert" className="aviso-erro">
        <p>{perfil.error.message}</p>
        <button type="button" className="btn" onClick={() => void perfil.refetch()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const p = perfil.data;
  const para = (nova: Aba, n = 1) => {
    const busca = new URLSearchParams();
    const nome = nomeNaUrl(nova);
    if (nome) busca.set('aba', nome);
    if (n > 1) busca.set('pagina', String(n));
    const texto = busca.toString();
    return { search: texto ? `?${texto}` : '' };
  };
  const abas: { chave: Aba; rotulo: string }[] = [
    { chave: 'publicacoes', rotulo: plural(p.postsCount, 'publicação', 'publicações') },
    { chave: 'followers', rotulo: plural(p.followersCount, 'seguidor', 'seguidores') },
    { chave: 'following', rotulo: `${p.followingCount} seguindo` },
  ];
  const lista = aba === 'publicacoes' ? null : pessoas.data;
  const tituloDaSecao = aba === 'publicacoes' ? 'Publicações' : aba === 'followers' ? 'Seguidores' : 'Seguindo';
  const filtrosVazios = { q: '', city: '', categoryId: '', page: pagina };

  return (
    <>
      <p>
        <Link to="/explorar">← Voltar para Explorar</Link>
      </p>
      <Cabecalho perfil={p} />

      <nav className="abas" aria-label={`Seções do perfil de ${p.name}`}>
        {abas.map((a) => (
          <Link key={a.chave} to={para(a.chave)} aria-current={a.chave === aba ? 'page' : undefined} className={a.chave === aba ? 'aba aba-ativa' : 'aba'}>
            {a.rotulo}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="secao">
        <h2 id="secao" ref={titulo} tabIndex={-1} className="resultado-titulo">
          {tituloDaSecao}
        </h2>

        {postsAtivos && (
          <>
            <Estado query={posts} vazio={posts.data && posts.data.meta.total === 0 ? 'Esta pessoa ainda não publicou nada.' : undefined} />
            {posts.data && posts.data.data.length > 0 && (
              <>
                <div className={posts.isPlaceholderData ? 'lista-posts carregando' : 'lista-posts'}>
                  {posts.data.data.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                {posts.data.meta.totalPages > 1 && (
                  <Paginacao filtros={filtrosVazios} totalPages={posts.data.meta.totalPages} para={(n) => para('publicacoes', n)} />
                )}
              </>
            )}
            {posts.data && posts.data.data.length === 0 && posts.data.meta.total > 0 && (
              <div className="vazio">
                <p>Esta página não existe.</p>
                <Link className="btn" to={para('publicacoes')}>
                  Voltar à primeira página
                </Link>
              </div>
            )}
          </>
        )}

        {!postsAtivos && (
          <>
            <Estado
              query={pessoas}
              vazio={
                lista && lista.meta.total === 0
                  ? aba === 'followers'
                    ? 'Ninguém segue esta pessoa ainda.'
                    : 'Esta pessoa ainda não segue ninguém.'
                  : undefined
              }
            />
            {lista && lista.data.length > 0 && (
              <>
                <ListaDePessoas pessoas={lista.data} />
                {lista.meta.totalPages > 1 && <Paginacao filtros={filtrosVazios} totalPages={lista.meta.totalPages} para={(n) => para(aba, n)} />}
              </>
            )}
            {lista && lista.data.length === 0 && lista.meta.total > 0 && (
              <div className="vazio">
                <p>Esta página não existe.</p>
                <Link className="btn" to={para(aba)}>
                  Voltar à primeira página
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      {ehAdmin(user) && user?.id !== p.id && <ExcluirContaDePessoa perfil={p} />}
    </>
  );
}
