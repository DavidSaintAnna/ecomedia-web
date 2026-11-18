import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useRanking } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { Field } from '../components/Field';
import { plural } from '../lib/format';

const TAMANHOS = [10, 25, 50];

function lerTamanho(valor: string | null): number {
  const n = Number(valor);
  return TAMANHOS.includes(n) ? n : 10;
}

export function Ranking() {
  const [params, setParams] = useSearchParams();
  const cidade = (params.get('cidade') ?? '').trim();
  const limite = lerTamanho(params.get('quantos'));
  const ranking = useRanking(cidade, limite);

  return (
    <>
      <h1>Ranking da comunidade</h1>
      <p className="subtitulo">Quem mais recebeu curtidas nas próprias publicações. Em caso de empate, vale quem publicou mais.</p>

      <FiltroRanking key={`${cidade}|${limite}`} cidade={cidade} limite={limite} onAplicar={(c, l) => setParams(montar(c, l))} onLimpar={() => setParams(new URLSearchParams())} />

      <section aria-labelledby="resultado" aria-busy={ranking.isFetching}>
        <h2 id="resultado" className="resultado-titulo">
          {cidade ? `Melhores de ${cidade}` : 'Melhores de todas as cidades'}
        </h2>

        {ranking.isPending && <p role="status">Carregando o ranking…</p>}

        {ranking.isError && (
          <div role="alert" className="aviso-erro">
            <p>{ranking.error.message}</p>
            <button type="button" className="btn" onClick={() => void ranking.refetch()}>
              Tentar de novo
            </button>
          </div>
        )}

        {ranking.data && ranking.data.length > 0 && (
          <ol className={ranking.isPlaceholderData ? 'ranking carregando' : 'ranking'}>
            {ranking.data.map((p) => (
              <li key={p.id} className="ranking-item">
                <span className="ranking-posicao" aria-label={`${p.rank}º lugar`}>
                  {p.rank}º
                </span>
                <Avatar name={p.name} url={p.avatarUrl} />
                <div className="ranking-dados">
                  <Link to={`/pessoas/${p.id}`} className="link-pessoa pessoa-nome">
                    {p.name}
                  </Link>
                  {p.city && <p className="post-meta">{p.city}</p>}
                </div>
                <p className="ranking-numeros">
                  <strong>{plural(p.likesReceived, 'curtida', 'curtidas')}</strong>
                  <span>{plural(p.postsCount, 'publicação', 'publicações')}</span>
                </p>
              </li>
            ))}
          </ol>
        )}

        {ranking.data && ranking.data.length === 0 && (
          <div className="vazio">
            <p>{cidade ? 'Ninguém dessa cidade publicou ainda. Tente outra cidade ou limpe o filtro.' : 'Ainda não há ninguém no ranking. Quando alguém publicar, aparece aqui.'}</p>
          </div>
        )}
      </section>
    </>
  );
}

function montar(cidade: string, limite: number) {
  const p = new URLSearchParams();
  if (cidade.trim()) p.set('cidade', cidade.trim());
  if (limite !== 10) p.set('quantos', String(limite));
  return p;
}

function FiltroRanking({ cidade, limite, onAplicar, onLimpar }: { cidade: string; limite: number; onAplicar: (c: string, l: number) => void; onLimpar: () => void }) {
  const [c, setC] = useState(cidade);
  const [l, setL] = useState(String(limite));
  function enviar(e: FormEvent) {
    e.preventDefault();
    onAplicar(c, Number(l));
  }
  return (
    <form className="filtros filtros-ranking" onSubmit={enviar} role="search" aria-label="Filtrar o ranking">
      <Field label="Cidade" type="search" name="cidade" value={c} onChange={(e) => setC(e.target.value)} />
      <div className="campo">
        <label htmlFor="ranking-quantos">Quantas pessoas</label>
        <select id="ranking-quantos" value={l} onChange={(e) => { setL(e.target.value); onAplicar(c, Number(e.target.value)); }}>
          {TAMANHOS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="filtros-acoes">
        <button type="submit" className="btn">
          Buscar
        </button>
        {(cidade || limite !== 10) && (
          <button type="button" className="btn btn-claro" onClick={onLimpar}>
            Limpar filtros
          </button>
        )}
      </div>
    </form>
  );
}
