import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { SetaDireita, SetaEsquerda } from '../ilustracoes/Icones';

interface Props {
  titulo: string;
  descricao?: string;
  /** Os "slides": cada filho precisa de role="group" e aria-roledescription="slide" (veja PublicacoesRecentes). */
  children: ReactNode;
  rotuloAnterior?: string;
  rotuloProximo?: string;
}

// Carrossel acessível, sem rotação automática (a pessoa decide quando avançar):
// - a pista é uma lista rolável com "snap"; no celular arrasta-se com o dedo;
// - os botões só aparecem quando há mais slides do que cabem na tela e se desligam nas pontas;
// - os slides têm links normais, então o Tab já leva a pessoa até eles (e o navegador rola até o foco).
export function Carrossel({ titulo, descricao, children, rotuloAnterior = 'Anteriores', rotuloProximo = 'Próximos' }: Props) {
  const idTitulo = useId();
  const idPista = useId();
  const pista = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState({ rola: false, noInicio: true, noFim: true });

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    const sobra = el.scrollWidth - el.clientWidth;
    setEstado({ rola: sobra > 4, noInicio: el.scrollLeft <= 4, noFim: el.scrollLeft >= sobra - 4 });
  }, []);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    // ResizeObserver não existe em todo ambiente (o jsdom dos testes não tem)
    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(medir);
    observador?.observe(el);
    return () => {
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
      observador?.disconnect();
    };
  }, [medir, children]);

  function rolar(direcao: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    const semMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // uma "página" por clique; o snap da pista acerta o alinhamento com o slide mais próximo
    el.scrollBy?.({ left: direcao * el.clientWidth, behavior: semMovimento ? 'auto' : 'smooth' });
  }

  return (
    <section className="secao" aria-roledescription="carrossel" aria-labelledby={idTitulo}>
      <div className="secao-cabeca">
        <div>
          <h2 id={idTitulo}>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        <div className="carrossel-controles" hidden={!estado.rola}>
          <button type="button" className="carrossel-botao" aria-label={rotuloAnterior} aria-controls={idPista} disabled={estado.noInicio} onClick={() => rolar(-1)}>
            <SetaEsquerda />
          </button>
          <button type="button" className="carrossel-botao" aria-label={rotuloProximo} aria-controls={idPista} disabled={estado.noFim} onClick={() => rolar(1)}>
            <SetaDireita />
          </button>
        </div>
      </div>
      <div id={idPista} ref={pista} className="carrossel-pista">
        {children}
      </div>
    </section>
  );
}
