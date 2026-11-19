import { useId } from 'react';

// Cores das ilustrações. São as mesmas da paleta do site (styles.css) mais alguns tons só de desenho.
export const COR = {
  escura: '#062a1f',
  floresta: '#0b3d2e',
  mata: '#14604a',
  folha: '#2f8f5b',
  folhaClara: '#79c96a',
  lima: '#c6f135',
  limaSuave: '#e8f8b4',
  creme: '#f6f3e3',
  papel: '#fffef8',
  areia: '#ece8d0',
  laranja: '#ff7a2f',
  laranjaClara: '#ffb58a',
  ceu: '#a9dcea',
  ceuEscuro: '#5fb3cc',
  mostarda: '#f6c453',
  terra: '#7a4a2b',
  peleClara: '#f1c27d',
  peleMedia: '#c68642',
  peleEscura: '#8d5524',
  peleProfunda: '#5c3a21',
} as const;

/** Identificador único por desenho, seguro para usar em url(#...) (o useId do React traz símbolos). */
export function useIdSeguro(): string {
  return 'e' + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Textura de grão no estilo "risografia": um ruído fino que escurece levemente as cores já pintadas
 * (a multiplicação mantém o tom de cada cor e não mexe no que é transparente).
 * `id` é a versão suave (para o desenho todo); `id + 's'` é a forte, para as manchas de sombra.
 */
export function GraoDefs({ id }: { id: string }) {
  return (
    <>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9" result="ruido" />
        <feColorMatrix
          in="ruido"
          type="matrix"
          values="1 0 0 0 0.52  1 0 0 0 0.52  1 0 0 0 0.52  0 0 0 0 1"
          result="tom"
        />
        <feComposite in="tom" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
      </filter>
      <filter id={`${id}s`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="5" result="ruido" />
        <feColorMatrix
          in="ruido"
          type="matrix"
          values="1.7 0 0 0 0.12  1.7 0 0 0 0.12  1.7 0 0 0 0.12  0 0 0 0 1"
          result="tom"
        />
        <feComposite in="tom" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
      </filter>
    </>
  );
}

/** Nuvem achatada embaixo, feita de círculos. (x, y) é o canto de baixo à esquerda. */
export function Nuvem({ x, y, escala = 1, cor = COR.papel }: { x: number; y: number; escala?: number; cor?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} fill={cor}>
      <rect x="0" y="-26" width="120" height="26" rx="13" />
      <circle cx="34" cy="-30" r="22" />
      <circle cx="66" cy="-40" r="28" />
      <circle cx="95" cy="-28" r="18" />
    </g>
  );
}

/** Pássaro: dois arcos. */
export function Passaro({ x, y, escala = 1, cor = COR.floresta }: { x: number; y: number; escala?: number; cor?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${escala})`}
      d="M0 0 Q7 -9 14 0 Q21 -9 28 0"
      fill="none"
      stroke={cor}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Folha grande com nervura (para emoldurar os cantos). Aponta para cima; gire com `rotacao`. */
export function Folha({
  x, y, rotacao = 0, escala = 1, cor = COR.folha, nervura = COR.lima,
}: { x: number; y: number; rotacao?: number; escala?: number; cor?: string; nervura?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotacao}) scale(${escala})`}>
      <path d="M0 0 C-34 -26 -34 -82 0 -120 C34 -82 34 -26 0 0Z" fill={cor} />
      <path d="M0 0 V-104" stroke={nervura} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M0 -30 L-14 -44 M0 -52 L-17 -68 M0 -74 L-12 -88 M0 -30 L14 -44 M0 -52 L17 -68 M0 -74 L12 -88" stroke={nervura} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Mudinha: caule e duas folhas. (x, y) é o pé do caule. */
export function Muda({ x, y, escala = 1, cor = COR.lima, caule = COR.folha }: { x: number; y: number; escala?: number; cor?: string; caule?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M0 0 V-16" stroke={caule} strokeWidth="3" strokeLinecap="round" />
      <path d="M0 -14 C0 -22 -6 -26 -14 -26 C-14 -17 -8 -14 0 -14Z" fill={cor} />
      <path d="M0 -18 C0 -27 6 -32 15 -32 C15 -22 9 -18 0 -18Z" fill={cor} />
    </g>
  );
}

/** Árvore de copa redonda. (x, y) é o pé do tronco. */
export function Arvore({ x, y, escala = 1, copa = COR.folha, luz = COR.folhaClara, tronco = COR.floresta }: { x: number; y: number; escala?: number; copa?: string; luz?: string; tronco?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x="-5" y="-46" width="10" height="46" rx="4" fill={tronco} />
      <circle cx="-20" cy="-66" r="26" fill={copa} />
      <circle cx="20" cy="-68" r="24" fill={copa} />
      <circle cx="0" cy="-88" r="30" fill={copa} />
      <circle cx="-8" cy="-94" r="14" fill={luz} opacity="0.55" />
      <circle cx="22" cy="-72" r="8" fill={luz} opacity="0.5" />
    </g>
  );
}
