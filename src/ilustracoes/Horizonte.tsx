import { COR, GraoDefs, useIdSeguro } from './base';

// Prédios: [x, largura, altura]. Fixos (não sorteados) para o desenho ser sempre o mesmo.
const PREDIOS: [number, number, number][] = [
  [0, 64, 70], [70, 52, 104], [128, 78, 62], [214, 56, 118], [276, 70, 84], [352, 48, 132], [406, 82, 66],
  [494, 58, 100], [558, 74, 78], [638, 50, 124], [694, 84, 64], [784, 60, 108], [850, 72, 80], [928, 52, 128],
  [986, 80, 70], [1072, 58, 98], [1136, 64, 76],
];
const ARVORES = [60, 330, 600, 880, 1120];

/** Faixa de prédios e árvores para o pé de um painel escuro. Tons de verde só um pouco mais claros que o fundo, com janelinhas lima. */
export function Horizonte({ className }: { className?: string }) {
  const id = useIdSeguro();
  return (
    <svg className={className} viewBox="0 0 1200 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <GraoDefs id={id} />
      </defs>
      <g filter={`url(#${id})`}>
        {PREDIOS.map(([x, w, h], i) => {
          const topo = 150 - h;
          const janelas = [];
          for (let l = 0; l < Math.floor((h - 18) / 20); l += 1) {
            for (let c = 0; c < Math.floor((w - 10) / 16); c += 1) {
              if ((i * 7 + l * 5 + c * 3) % 5 === 0) {
                janelas.push(<rect key={`${l}-${c}`} x={x + 9 + c * 16} y={topo + 14 + l * 20} width="7" height="10" rx="2" fill={COR.lima} opacity="0.85" />);
              }
            }
          }
          return (
            <g key={x}>
              <rect x={x} y={topo} width={w} height={h + 2} rx="5" fill={i % 2 ? COR.floresta : COR.mata} />
              {janelas}
            </g>
          );
        })}
        {ARVORES.map((x) => (
          <g key={x}>
            <rect x={x - 3} y="126" width="6" height="26" rx="3" fill={COR.floresta} />
            <circle cx={x} cy="116" r="19" fill={COR.folha} />
            <circle cx={x - 12} cy="124" r="13" fill={COR.folha} />
            <circle cx={x + 13} cy="125" r="12" fill={COR.folha} />
          </g>
        ))}
        <rect x="0" y="144" width="1200" height="6" fill={COR.floresta} />
      </g>
    </svg>
  );
}
