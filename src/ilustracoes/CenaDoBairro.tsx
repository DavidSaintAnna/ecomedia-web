import { Arvore, COR, Folha, GraoDefs, Muda, Nuvem, Passaro, useIdSeguro } from './base';
import { Bicicleta, Janelas, Lixeiras, PainelSolar, Pessoa } from './pecas';

const ARCO = 'M0 280 A280 280 0 0 1 560 280 V566 Q560 610 516 610 H44 Q0 610 0 566 Z';

export function CenaDoBairro({ className }: { className?: string }) {
  const id = useIdSeguro();
  const grao = `url(#${id})`;
  const graoForte = `url(#${id}s)`;

  return (
    <svg className={className} viewBox="-3 -3 566 616" aria-hidden="true" focusable="false">
      <defs>
        <GraoDefs id={id} />
        <clipPath id={`${id}c`}>
          <path d={ARCO} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}c)`}>
        <g filter={grao}>
          {/* céu */}
          <rect x="-3" y="-3" width="566" height="616" fill={COR.lima} />
          <circle cx="388" cy="176" r="118" fill="#d6f65c" />
          <circle cx="388" cy="176" r="84" fill="#e1f98b" />
          <circle cx="388" cy="176" r="52" fill={COR.laranja} />
          <circle cx="374" cy="164" r="30" fill="#ff9650" opacity="0.7" />
          <Nuvem x={64} y={168} escala={1} />
          <Nuvem x={300} y={92} escala={0.62} />
          <Nuvem x={452} y={262} escala={0.5} />
          <Passaro x={196} y={96} />
          <Passaro x={230} y={78} escala={0.8} />
          <Passaro x={168} y={72} escala={0.65} />

          {/* morros ao fundo */}
          <path d="M-3 346 C70 306 150 300 230 330 C300 356 370 318 450 312 C500 308 540 322 563 332 V450 H-3Z" fill="#4fb06a" />

          {/* prédios */}
          {/* 1: telhado verde */}
          <rect x="34" y="262" width="74" height="170" rx="6" fill={COR.creme} />
          <rect x="34" y="254" width="74" height="14" rx="7" fill={COR.folhaClara} />
          <circle cx="50" cy="250" r="9" fill={COR.folha} />
          <circle cx="66" cy="246" r="11" fill={COR.folha} />
          <circle cx="86" cy="251" r="8" fill={COR.folha} />
          <Janelas x={44} y={282} colunas={3} linhas={5} acesas={[1, 7, 10]} />

          {/* 2: torre com varandas verdes e painéis solares */}
          <rect x="118" y="200" width="58" height="232" rx="6" fill={COR.papel} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x="114" y={238 + i * 38} width="66" height="7" rx="3.500" fill={COR.floresta} />
              <circle cx="124" cy={236 + i * 38} r="6" fill={COR.folha} />
              <circle cx="136" cy={238 + i * 38} r="5" fill={COR.folhaClara} />
              <circle cx="166" cy={236 + i * 38} r="6" fill={COR.folha} />
              <rect x="130" y={208 + i * 38} width="14" height="22" rx="3" fill={COR.floresta} />
              <rect x="152" y={208 + i * 38} width="14" height="22" rx="3" fill={i === 2 ? COR.laranjaClara : COR.floresta} />
            </g>
          ))}
          <PainelSolar x={122} y={179} escala={0.8} />
          <PainelSolar x={148} y={179} escala={0.8} />

          {/* 3: padaria com toldo */}
          <rect x="186" y="292" width="96" height="140" rx="6" fill={COR.areia} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${196 + i * 28} 340 V326 a11 11 0 0 1 22 0 V340Z`} fill={COR.floresta} />
          ))}
          <Janelas x={196} y={352} colunas={3} linhas={1} w={22} h={12} passoX={28} />
          <path d="M182 392 H286 L280 412 H188Z" fill={COR.laranja} />
          <path d="M194 392 V412 M212 392 V412 M230 392 V412 M248 392 V412 M266 392 V412" stroke={COR.papel} strokeWidth="5" opacity="0.9" />
          <rect x="200" y="412" width="76" height="22" fill={COR.floresta} />
          <rect x="190" y="286" width="88" height="10" rx="5" fill={COR.mata} />

          {/* 4: telhado com árvore */}
          <rect x="292" y="236" width="66" height="196" rx="6" fill={COR.papel} />
          <rect x="290" y="228" width="70" height="14" rx="7" fill={COR.folhaClara} />
          <Arvore x={324} y={230} escala={0.34} />
          <Janelas x={302} y={256} colunas={3} linhas={6} w={12} h={16} passoX={19} passoY={28} acesas={[4, 11]} />

          {/* 5: painéis solares no alto */}
          <rect x="368" y="282" width="84" height="150" rx="6" fill={COR.creme} />
          <PainelSolar x={374} y={259} escala={0.9} />
          <PainelSolar x={408} y={259} escala={0.9} />
          <Janelas x={380} y={302} colunas={4} linhas={4} w={12} h={16} passoX={19} passoY={30} acesas={[2, 9]} />

          {/* 6: cafeteria */}
          <rect x="462" y="318" width="70" height="114" rx="6" fill={COR.papel} />
          <Janelas x={474} y={336} colunas={3} linhas={2} w={14} h={18} passoX={21} passoY={30} />
          <path d="M458 394 H536 L531 412 H463Z" fill={COR.mostarda} />
          <path d="M470 394 V412 M486 394 V412 M502 394 V412 M518 394 V412" stroke={COR.papel} strokeWidth="4.500" opacity="0.9" />

          {/* sombras dos prédios (com grão mais forte) */}
          <g filter={graoForte} fill={COR.floresta} opacity="0.2">
            <rect x="82" y="262" width="26" height="170" />
            <rect x="152" y="200" width="24" height="232" />
            <rect x="254" y="292" width="28" height="140" />
            <rect x="334" y="236" width="24" height="196" />
            <rect x="424" y="282" width="28" height="150" />
            <rect x="508" y="318" width="24" height="114" />
          </g>

          {/* morro do meio, árvores e ciclovia */}
          <path d="M-3 432 C90 398 200 404 290 426 C380 446 470 420 563 402 V613 H-3Z" fill={COR.mata} />
          <Arvore x={58} y={436} escala={0.82} />
          <Arvore x={512} y={430} escala={0.7} />
          <path d="M-30 506 C110 468 250 482 340 498 C430 514 500 496 600 468" fill="none" stroke={COR.limaSuave} strokeWidth="44" />
          <path d="M-30 506 C110 468 250 482 340 498 C430 514 500 496 600 468" fill="none" stroke={COR.floresta} strokeWidth="3" strokeDasharray="16 14" />
          <Bicicleta x={152} y={496} escala={1.05} />

          {/* primeiro plano */}
          <path d="M-3 560 C100 530 210 538 300 556 C390 574 480 556 563 530 V613 H-3Z" fill={COR.floresta} />
          <Folha x={22} y={612} rotacao={-18} escala={1.25} cor={COR.folha} />
          <Folha x={62} y={616} rotacao={14} escala={0.9} cor={COR.mata} nervura={COR.folha} />
          <Folha x={548} y={614} rotacao={20} escala={1.2} cor={COR.folha} />
          <Lixeiras x={128} y={606} escala={0.95} />

          {/* quem segura a muda fica atrás do canteiro */}
          <Pessoa x={474} y={604} escala={0.98} pele={COR.peleClara} cabelo="#3b2314" camisa={COR.papel} calca={COR.creme} cabeloLongo>
            <path d="M-17 -100 L-9 -74" stroke={COR.peleClara} strokeWidth="8.500" strokeLinecap="round" fill="none" />
            <path d="M17 -100 L9 -74" stroke={COR.peleClara} strokeWidth="8.500" strokeLinecap="round" fill="none" />
            <path d="M-14 -76 H14 L11 -56 H-11Z" fill={COR.laranja} />
            <Muda x={0} y={-76} escala={1.5} />
          </Pessoa>

          {/* canteiro */}
          <path d="M338 580 L520 580 L534 608 L324 608Z" fill={COR.terra} />
          <path d="M346 566 H512 L520 580 H338Z" fill="#9a6238" />
          {[358, 388, 418, 448, 478].map((px) => (
            <Muda key={px} x={px} y={575} escala={1.15} />
          ))}

          {/* quem rega */}
          <Pessoa x={292} y={602} escala={1.02} pele={COR.peleEscura} cabelo="#2b1a10" camisa={COR.ceu} calca={COR.creme}>
            <path d="M-12 -104 L-17 -72" stroke={COR.peleEscura} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M10 -104 L42 -94" stroke={COR.peleEscura} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M40 -100 C27 -106 27 -86 40 -86" stroke={COR.mata} strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="40" y="-106" width="32" height="26" rx="6" fill={COR.ceuEscuro} />
            <path d="M70 -96 L96 -114 L100 -109 L74 -86Z" fill={COR.ceuEscuro} />
            <path d="M104 -104 q-3 6 0 9 q3 -3 0 -9Z M108 -90 q-3 6 0 9 q3 -3 0 -9Z M105 -76 q-3 6 0 9 q3 -3 0 -9Z M110 -62 q-3 6 0 9 q3 -3 0 -9Z" fill={COR.ceu} />
          </Pessoa>
        </g>
      </g>
      <path d={ARCO} fill="none" stroke={COR.floresta} strokeWidth="6" />
    </svg>
  );
}
