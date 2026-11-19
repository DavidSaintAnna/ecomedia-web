import type { ReactNode } from 'react';
import { COR, Muda } from './base';

/** Grade de janelas retangulares. */
export function Janelas({
  x, y, colunas, linhas, w = 13, h = 17, passoX = 20, passoY = 26, cor = COR.floresta, acesas = [], acesa = COR.laranjaClara,
}: {
  x: number; y: number; colunas: number; linhas: number; w?: number; h?: number; passoX?: number; passoY?: number;
  cor?: string; acesas?: number[]; acesa?: string;
}) {
  const itens = [];
  for (let l = 0; l < linhas; l += 1) {
    for (let c = 0; c < colunas; c += 1) {
      const i = l * colunas + c;
      itens.push(<rect key={i} x={x + c * passoX} y={y + l * passoY} width={w} height={h} rx="3" fill={acesas.includes(i) ? acesa : cor} />);
    }
  }
  return <g>{itens}</g>;
}

export function PainelSolar({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M0 10 L34 0 L34 16 L0 26Z" fill={COR.floresta} />
      <path d="M11 7 V23 M22 3.500 V19.500 M0 18 L34 8" stroke={COR.ceu} strokeWidth="1.600" fill="none" />
    </g>
  );
}

export function Bicicleta({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  const traco = { stroke: COR.escura, strokeWidth: 3.400, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {/* rodas */}
      <circle cx="0" cy="0" r="20" {...traco} />
      <circle cx="56" cy="0" r="20" {...traco} />
      <circle cx="0" cy="0" r="3" fill={COR.escura} />
      <circle cx="56" cy="0" r="3" fill={COR.escura} />
      {/* quadro */}
      <path d="M0 0 L24 2 L20 -28 Z M24 2 L47 -30 L20 -28 M47 -30 L56 0 M47 -30 L45 -38 M40 -38 L52 -38 M14 -32 L27 -32" {...traco} />
      {/* ciclista: perna, tronco, braço e cabeça */}
      <path d="M20 -34 L39 -16 L26 2" stroke={COR.floresta} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 -36 L42 -60" stroke={COR.mostarda} strokeWidth="17" strokeLinecap="round" fill="none" />
      <path d="M40 -57 L51 -40" stroke={COR.peleMedia} strokeWidth="6.500" strokeLinecap="round" fill="none" />
      <circle cx="49" cy="-75" r="10" fill={COR.peleMedia} />
      <path d="M39 -77 C39 -88 56 -90 59 -78 C54 -81 46 -80 39 -77Z" fill={COR.escura} />
      {/* cestinha com mudas */}
      <path d="M54 -36 H72 L69 -22 H57Z" fill={COR.laranja} />
      <Muda x={62} y={-36} escala={0.9} />
    </g>
  );
}

/** Pessoa de pé, de frente. (x, y) = pés. Os braços e objetos entram como filhos, em coordenadas da pessoa (cabeça em y = -128). */
export function Pessoa({
  x, y, escala = 1, pele, cabelo, camisa, calca, cabeloLongo = false, children,
}: {
  x: number; y: number; escala?: number; pele: string; cabelo: string; camisa: string; calca: string; cabeloLongo?: boolean; children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {cabeloLongo && <path d="M-17 -128 C-20 -150 20 -150 17 -128 L20 -96 H-20Z" fill={cabelo} />}
      <rect x="-13" y="-58" width="12" height="58" rx="6" fill={calca} />
      <rect x="1" y="-58" width="12" height="58" rx="6" fill={calca} />
      <ellipse cx="-8" cy="-1" rx="10" ry="5" fill={COR.laranja} />
      <ellipse cx="9" cy="-1" rx="10" ry="5" fill={COR.laranja} />
      <path d="M-20 -56 V-98 Q-20 -112 -6 -112 H6 Q20 -112 20 -98 V-56Z" fill={camisa} />
      <rect x="-5" y="-118" width="10" height="12" rx="4" fill={pele} />
      <circle cx="0" cy="-130" r="15" fill={pele} />
      <path d="M-16 -131 C-17 -150 17 -150 16 -131 C10 -139 -8 -139 -16 -131Z" fill={cabelo} />
      <circle cx="-5" cy="-129" r="1.600" fill={COR.escura} />
      <circle cx="5" cy="-129" r="1.600" fill={COR.escura} />
      {children}
    </g>
  );
}

export function Lixeiras({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  const cores = [COR.lima, COR.ceu, COR.laranja];
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {cores.map((cor, i) => (
        <g key={cor} transform={`translate(${i * 36} 0)`}>
          <rect x="0" y="-46" width="29" height="46" rx="5" fill={cor} />
          <rect x="-3" y="-53" width="35" height="10" rx="5" fill={COR.papel} />
          <path d="M9 -24 a6.500 6.500 0 1 1 3 5.500" stroke={COR.floresta} strokeWidth="2.400" strokeLinecap="round" fill="none" />
          <path d="M5.500 -25 L10 -29 L12 -22Z" fill={COR.floresta} />
        </g>
      ))}
    </g>
  );
}


const grausParaRad = (g: number) => (g * Math.PI) / 180;
const n = (v: number) => v.toFixed(1);

/** Três setas em círculo (o símbolo da reciclagem). */
export function SetasDeReciclar({ cx, cy, r, cor = COR.floresta, espessura = 9 }: { cx: number; cy: number; r: number; cor?: string; espessura?: number }) {
  const ponto = (g: number, raio = r): [number, number] => [cx + raio * Math.cos(grausParaRad(g)), cy + raio * Math.sin(grausParaRad(g))];
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a0 = -90 + i * 120 + 14;
        const a1 = a0 + 76;
        const [x0, y0] = ponto(a0);
        const [x1, y1] = ponto(a1);
        const [bx, by] = ponto(a1, r + espessura * 1.15);
        const [qx, qy] = ponto(a1, r - espessura * 1.15);
        const [px, py] = ponto(a1 + 21);
        return (
          <g key={i}>
            <path d={`M${n(x0)} ${n(y0)} A${r} ${r} 0 0 1 ${n(x1)} ${n(y1)}`} stroke={cor} strokeWidth={espessura} fill="none" />
            <path d={`M${n(bx)} ${n(by)} L${n(px)} ${n(py)} L${n(qx)} ${n(qy)}Z`} fill={cor} />
          </g>
        );
      })}
    </g>
  );
}

/** Turbina de vento: torre e três pás. (x, y) = pé da torre. */
export function Turbina({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-3.500 0 L3.500 0 L2 -82 L-2 -82Z" fill={COR.papel} />
      <g transform="translate(0 -84)">
        {[-12, 108, 228].map((g) => (
          <path key={g} transform={`rotate(${g})`} d="M0 0 C4.500 -12 4.500 -30 0 -50 C-4.500 -30 -4.500 -12 0 0Z" fill={COR.papel} />
        ))}
        <circle r="5.500" fill={COR.laranja} />
      </g>
    </g>
  );
}

/** Ondas horizontais que preenchem de `y` até o fim do quadro (300 de largura). */
export function Ondas({ y, cor, amplitude = 10, passo = 37.5 }: { y: number; cor: string; amplitude?: number; passo?: number }) {
  const meio = `q${passo / 2} ${-amplitude} ${passo} 0`;
  const resto = Array.from({ length: Math.ceil(300 / passo) }, () => `t${passo} 0`).join(' ');
  return <path d={`M0 ${y} ${meio} ${resto} V230H0Z`} fill={cor} />;
}
