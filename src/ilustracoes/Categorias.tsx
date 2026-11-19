import type { ReactNode } from 'react';
import { COR, GraoDefs, Muda, Nuvem, useIdSeguro, Arvore } from './base';
import { Bicicleta, Lixeiras, Ondas, PainelSolar, Pessoa, SetasDeReciclar, Turbina } from './pecas';

export type ChaveCategoria = 'reciclagem' | 'agua' | 'energia' | 'mobilidade' | 'hortas' | 'mutirao' | 'residuos' | 'padrao';

/** Descobre o desenho pelo nome da categoria (sem acento e sem diferenciar maiúsculas). Nome novo, criado por um administrador, cai no desenho padrão. */
export function chaveDaCategoria(nome: string): ChaveCategoria {
  const n = nome.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (/recicl/.test(n)) return 'reciclagem';
  if (/agua|hidric/.test(n)) return 'agua';
  if (/energi|solar/.test(n)) return 'energia';
  if (/mobilid|transport|bici|ciclo/.test(n)) return 'mobilidade';
  if (/horta|jardim|planta|agricult/.test(n)) return 'hortas';
  if (/mutir|limpeza|praia/.test(n)) return 'mutirao';
  if (/residuo|lixo|reduc|compost|consumo/.test(n)) return 'residuos';
  return 'padrao';
}

/** Quadro 300 x 230 com fundo liso e grão por cima. `forte` é o filtro de grão mais pesado, para manchas de sombra. */
function Quadro({ fundo, children }: { fundo: string; children: (forte: string) => ReactNode }) {
  const id = useIdSeguro();
  return (
    <svg className="ilustracao" viewBox="0 0 300 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <GraoDefs id={id} />
      </defs>
      <g filter={`url(#${id})`}>
        <rect width="300" height="230" fill={fundo} />
        {children(`url(#${id}s)`)}
      </g>
    </svg>
  );
}

function Reciclagem() {
  return (
    <Quadro fundo={COR.lima}>
      {() => (
        <>
          <circle cx="150" cy="102" r="88" fill="#d6f65c" />
          <circle cx="150" cy="102" r="70" fill={COR.papel} />
          <SetasDeReciclar cx={150} cy={102} r={37} />
          <g transform="translate(46 72) rotate(-18)">
            <rect x="-10" y="0" width="20" height="46" rx="7" fill={COR.ceu} />
            <rect x="-5" y="-12" width="10" height="14" rx="3" fill={COR.ceu} />
            <rect x="-6" y="-17" width="12" height="6" rx="2" fill={COR.laranja} />
            <rect x="-10" y="16" width="20" height="12" fill={COR.papel} opacity="0.7" />
          </g>
          <g transform="translate(254 62) rotate(14)">
            <rect x="-13" y="0" width="26" height="40" rx="4" fill={COR.laranja} />
            <ellipse cx="0" cy="0" rx="13" ry="4" fill={COR.laranjaClara} />
            <rect x="-13" y="14" width="26" height="9" fill={COR.papel} />
          </g>
          <g transform="translate(236 128) rotate(-8)">
            <rect x="0" y="0" width="40" height="32" rx="3" fill={COR.mostarda} />
            <rect x="15" y="0" width="10" height="10" fill={COR.areia} />
            <path d="M0 10 H40" stroke={COR.floresta} strokeWidth="2" opacity="0.35" />
          </g>
          <path d="M0 196 Q80 176 160 192 T300 184 V230 H0Z" fill={COR.folha} />
          <path d="M0 214 Q100 202 200 212 T300 206 V230 H0Z" fill={COR.floresta} />
          <Lixeiras x={96} y={228} escala={0.8} />
        </>
      )}
    </Quadro>
  );
}

function Agua() {
  return (
    <Quadro fundo={COR.ceu}>
      {(forte) => (
        <>
          <circle cx="206" cy="108" r="82" fill="#c3e8f2" />
          <Nuvem x={20} y={78} escala={0.85} />
          <path d="M44 94 q-4 8 0 12 q4 -4 0 -12Z M72 108 q-4 8 0 12 q4 -4 0 -12Z M100 94 q-4 8 0 12 q4 -4 0 -12Z M58 124 q-4 8 0 12 q4 -4 0 -12Z M86 138 q-4 8 0 12 q4 -4 0 -12Z" fill={COR.ceuEscuro} />
          <path d="M206 26 C206 26 158 86 158 122 a48 48 0 0 0 96 0 C254 86 206 26 206 26Z" fill={COR.papel} />
          <path d="M206 26 C206 26 254 86 254 122 A48 48 0 0 1 206 170 C238 150 238 90 206 26Z" fill={COR.ceuEscuro} opacity="0.4" filter={forte} />
          <ellipse cx="184" cy="120" rx="7" ry="17" fill={COR.ceu} transform="rotate(14 184 120)" />
          <Ondas y={176} cor={COR.ceuEscuro} />
          <Ondas y={194} cor={COR.mata} amplitude={9} />
          <Ondas y={212} cor={COR.floresta} amplitude={8} />
          <g transform="translate(62 172) rotate(-12)">
            <path d="M0 0 C10 -14 28 -14 38 0 C28 8 10 8 0 0Z" fill={COR.lima} />
            <path d="M2 0 H34" stroke={COR.floresta} strokeWidth="1.800" strokeLinecap="round" />
          </g>
        </>
      )}
    </Quadro>
  );
}

function Energia() {
  return (
    <Quadro fundo={COR.mostarda}>
      {() => (
        <>
          <circle cx="232" cy="58" r="54" fill="#f9d377" />
          <g transform="translate(232 58)">
            {Array.from({ length: 12 }, (_, i) => i * 30).map((g) => (
              <rect key={g} x="-3.500" y="-46" width="7" height="15" rx="3.500" fill={COR.laranja} transform={`rotate(${g})`} />
            ))}
            <circle r="26" fill={COR.laranja} />
          </g>
          <circle cx="46" cy="50" r="23" fill={COR.floresta} />
          <path d="M52 33 L36 54 H46 L42 69 L59 46 H49Z" fill={COR.lima} />
          <path d="M0 172 Q90 118 190 160 T300 150 V230 H0Z" fill={COR.folhaClara} />
          <Turbina x={96} y={150} />
          <Turbina x={152} y={160} escala={0.62} />
          <path d="M0 198 Q110 172 200 194 T300 186 V230 H0Z" fill={COR.folha} />
          <PainelSolar x={146} y={192} escala={1.35} />
          <PainelSolar x={196} y={186} escala={1.35} />
          <PainelSolar x={246} y={180} escala={1.35} />
        </>
      )}
    </Quadro>
  );
}

function Mobilidade() {
  const janelas = (x: number, y: number, cols: number, rows: number) =>
    Array.from({ length: cols * rows }, (_, i) => (
      <rect key={`${x}-${y}-${i}`} x={x + (i % cols) * 14} y={y + Math.floor(i / cols) * 18} width="8" height="11" rx="2" fill={COR.floresta} opacity="0.85" />
    ));
  return (
    <Quadro fundo={COR.laranjaClara}>
      {() => (
        <>
          <circle cx="248" cy="40" r="26" fill={COR.mostarda} />
          <rect x="14" y="78" width="48" height="76" rx="5" fill={COR.papel} />
          <rect x="70" y="58" width="56" height="96" rx="5" fill={COR.creme} />
          <rect x="134" y="92" width="40" height="62" rx="5" fill={COR.papel} />
          {janelas(22, 90, 3, 3)}
          {janelas(80, 70, 3, 4)}
          {janelas(142, 104, 2, 2)}
          <rect x="0" y="152" width="300" height="14" fill={COR.floresta} />
          <g>
            <rect x="170" y="98" width="118" height="56" rx="14" fill={COR.papel} />
            <rect x="170" y="98" width="118" height="12" rx="6" fill={COR.lima} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={180 + i * 26} y="116" width="20" height="18" rx="4" fill={COR.ceu} />
            ))}
            <circle cx="198" cy="156" r="11" fill={COR.escura} />
            <circle cx="260" cy="156" r="11" fill={COR.escura} />
            <circle cx="198" cy="156" r="4.500" fill={COR.papel} />
            <circle cx="260" cy="156" r="4.500" fill={COR.papel} />
            <rect x="282" y="132" width="8" height="8" rx="3" fill={COR.laranja} />
          </g>
          <path d="M0 188 Q100 172 200 184 T300 176 V230 H0Z" fill={COR.limaSuave} />
          <path d="M-6 208 Q100 194 200 206 T306 198" fill="none" stroke={COR.floresta} strokeWidth="3.500" strokeDasharray="18 14" />
          <Bicicleta x={70} y={196} escala={1.3} />
        </>
      )}
    </Quadro>
  );
}

function Hortas() {
  const petalas = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <Quadro fundo={COR.limaSuave}>
      {() => (
        <>
          <rect y="28" width="300" height="134" fill={COR.creme} />
          <path d="M28 140 V86 a24 24 0 0 1 48 0 V140Z" fill={COR.floresta} />
          <path d="M34 140 V86 a18 18 0 0 1 36 0 V140Z" fill={COR.ceu} />
          <path d="M224 140 V86 a24 24 0 0 1 48 0 V140Z" fill={COR.floresta} />
          <path d="M230 140 V86 a18 18 0 0 1 36 0 V140Z" fill={COR.ceu} />
          <path d="M52 68 V140 M230 86 H266" stroke={COR.floresta} strokeWidth="2.400" opacity="0.5" />
          <rect y="160" width="300" height="70" fill={COR.folha} />
          {/* canteiro da esquerda: girassol e alfaces */}
          <path d="M62 152 V98" stroke={COR.mata} strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="50" cy="128" rx="14" ry="6" fill={COR.mata} transform="rotate(-28 50 128)" />
          <ellipse cx="76" cy="120" rx="14" ry="6" fill={COR.mata} transform="rotate(28 76 120)" />
          <g transform="translate(62 86)">
            {petalas.map((g) => (
              <ellipse key={g} cx="0" cy="-17" rx="6" ry="10" fill={COR.mostarda} transform={`rotate(${g})`} />
            ))}
            <circle r="11" fill={COR.terra} />
          </g>
          {[100, 124].map((x) => (
            <g key={x}>
              <circle cx={x} cy="146" r="15" fill={COR.folhaClara} />
              <circle cx={x} cy="146" r="10" fill={COR.lima} />
              <circle cx={x} cy="146" r="4.500" fill={COR.limaSuave} />
            </g>
          ))}
          <rect x="32" y="152" width="112" height="46" rx="7" fill={COR.terra} />
          <rect x="32" y="152" width="112" height="12" rx="6" fill="#9a6238" />
          {/* canteiro da direita: tomateiro e cenouras */}
          <path d="M190 154 V96" stroke={COR.terra} strokeWidth="3" strokeLinecap="round" />
          <circle cx="190" cy="108" r="15" fill={COR.mata} />
          <circle cx="174" cy="126" r="14" fill={COR.mata} />
          <circle cx="206" cy="124" r="14" fill={COR.mata} />
          <circle cx="184" cy="104" r="7" fill={COR.folha} opacity="0.8" />
          <circle cx="176" cy="132" r="7.500" fill={COR.laranja} />
          <circle cx="207" cy="134" r="7.500" fill={COR.laranja} />
          <circle cx="194" cy="118" r="7.500" fill={COR.laranja} />
          {[236, 250, 264].map((x) => (
            <g key={x} transform={`translate(${x} 152)`}>
              <path d="M0 0 q-7 -14 -3 -27 M0 0 q0 -17 3 -29 M0 0 q7 -14 9 -22" stroke={COR.lima} strokeWidth="3.200" strokeLinecap="round" fill="none" />
            </g>
          ))}
          <rect x="156" y="152" width="112" height="46" rx="7" fill={COR.terra} />
          <rect x="156" y="152" width="112" height="12" rx="6" fill="#9a6238" />
          {[236, 250, 264].map((x) => (
            <path key={x} d={`M${x - 5} 164 L${x + 5} 164 L${x} 180Z`} fill={COR.laranja} />
          ))}
          {/* abelha */}
          <g transform="translate(104 64) rotate(-12)">
            <ellipse cx="-4" cy="-8" rx="7" ry="4" fill={COR.papel} opacity="0.9" />
            <ellipse cx="5" cy="-8" rx="7" ry="4" fill={COR.papel} opacity="0.9" />
            <ellipse rx="11" ry="7" fill={COR.mostarda} />
            <path d="M-3 -6 V6 M3 -6 V6" stroke={COR.escura} strokeWidth="2.600" />
          </g>
          <path d="M0 214 Q100 202 200 212 T300 206 V230 H0Z" fill={COR.mata} />
        </>
      )}
    </Quadro>
  );
}

function Mutirao() {
  return (
    <Quadro fundo={COR.ceu}>
      {() => (
        <>
          <circle cx="238" cy="44" r="22" fill={COR.mostarda} />
          <Nuvem x={34} y={58} escala={0.6} />
          <Ondas y={104} cor={COR.ceuEscuro} amplitude={6} passo={30} />
          <path d="M0 132 Q90 120 190 134 T300 126 V230 H0Z" fill="#f9dc8f" />
          <Arvore x={30} y={170} escala={0.55} />
          {/* lixo na areia */}
          <g transform="translate(232 190) rotate(-70)">
            <rect x="-6" y="0" width="12" height="26" rx="4" fill={COR.ceuEscuro} />
            <rect x="-3" y="-8" width="6" height="10" rx="2" fill={COR.ceuEscuro} />
          </g>
          <g transform="translate(70 206) rotate(18)">
            <rect x="-8" y="0" width="16" height="22" rx="3" fill={COR.laranja} />
            <rect x="-8" y="7" width="16" height="6" fill={COR.papel} />
          </g>
          {/* quem carrega o saco */}
          <Pessoa x={112} y={216} escala={0.66} pele={COR.peleClara} cabelo="#3b2314" camisa={COR.laranja} calca={COR.floresta} cabeloLongo>
            <path d="M-12 -104 L-16 -72" stroke={COR.peleClara} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M12 -104 L34 -80" stroke={COR.peleClara} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M22 -80 C16 -118 62 -118 56 -80 C62 -56 18 -56 22 -80Z" fill={COR.floresta} />
            <path d="M34 -104 L44 -112" stroke={COR.floresta} strokeWidth="4" strokeLinecap="round" />
            <path d="M30 -92 q9 6 18 0" stroke={COR.lima} strokeWidth="3" fill="none" strokeLinecap="round" />
          </Pessoa>
          {/* quem cata com a pinça */}
          <Pessoa x={196} y={218} escala={0.66} pele={COR.peleMedia} cabelo="#2b1a10" camisa={COR.papel} calca={COR.mata}>
            <path d="M-12 -104 L-16 -72" stroke={COR.peleMedia} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M12 -104 L32 -84" stroke={COR.peleMedia} strokeWidth="9" strokeLinecap="round" fill="none" />
            <path d="M30 -88 L62 -10" stroke={COR.floresta} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M62 -10 l-9 -8 M62 -10 l5 -11" stroke={COR.floresta} strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="52" y="-6" width="12" height="9" rx="3" fill={COR.ceuEscuro} transform="rotate(-20 58 -2)" />
          </Pessoa>
          {/* lixeira */}
          <g transform="translate(262 214)">
            <rect x="-15" y="-38" width="30" height="38" rx="5" fill={COR.mata} />
            <rect x="-18" y="-45" width="36" height="9" rx="4.500" fill={COR.floresta} />
            <path d="M-6 -26 V-8 M0 -26 V-8 M6 -26 V-8" stroke={COR.lima} strokeWidth="2.600" strokeLinecap="round" />
          </g>
        </>
      )}
    </Quadro>
  );
}

function Residuos() {
  return (
    <Quadro fundo={COR.folhaClara}>
      {() => (
        <>
          <circle cx="150" cy="108" r="92" fill="#8fd47f" />
          {/* vidro com granola */}
          <rect x="30" y="112" width="40" height="12" rx="4" fill={COR.floresta} />
          <rect x="32" y="122" width="36" height="68" rx="10" fill={COR.ceu} opacity="0.9" />
          <rect x="32" y="146" width="36" height="44" rx="10" fill={COR.mostarda} />
          <rect x="38" y="156" width="24" height="18" rx="3" fill={COR.papel} />
          {/* garrafa reutilizável */}
          <rect x="238" y="96" width="30" height="94" rx="12" fill={COR.floresta} />
          <rect x="246" y="82" width="14" height="18" rx="3" fill={COR.floresta} />
          <rect x="244" y="74" width="18" height="10" rx="4" fill={COR.laranja} />
          <rect x="238" y="130" width="30" height="14" fill={COR.lima} />
          {/* sacola de pano */}
          <path d="M122 100 C122 40 182 40 182 100" fill="none" stroke={COR.papel} strokeWidth="9" strokeLinecap="round" />
          <Muda x={124} y={104} escala={1.7} cor={COR.lima} caule={COR.mata} />
          <rect x="154" y="62" width="14" height="40" rx="7" fill={COR.lima} transform="rotate(8 161 82)" />
          <rect x="152" y="46" width="20" height="26" rx="9" fill={COR.folha} transform="rotate(8 161 82)" />
          <g transform="translate(176 88) rotate(-32)">
            <rect x="0" y="-9" width="62" height="18" rx="9" fill={COR.mostarda} />
            <path d="M14 -9 L20 9 M30 -9 L36 9 M46 -9 L52 9" stroke={COR.terra} strokeWidth="2.200" strokeLinecap="round" />
          </g>
          <path d="M88 100 H216 L226 204 H78Z" fill={COR.papel} />
          <path d="M184 100 H216 L226 204 H190Z" fill={COR.floresta} opacity="0.12" />
          <path d="M152 188 C118 168 118 128 152 112 C186 128 186 168 152 188Z" fill={COR.lima} />
          <path d="M152 188 V120 M152 150 L138 136 M152 164 L166 150" stroke={COR.floresta} strokeWidth="2.800" strokeLinecap="round" fill="none" />
          <path d="M0 208 Q100 192 200 206 T300 198 V230 H0Z" fill={COR.floresta} />
        </>
      )}
    </Quadro>
  );
}

function Padrao() {
  return (
    <Quadro fundo={COR.limaSuave}>
      {() => (
        <>
          <circle cx="226" cy="58" r="28" fill={COR.mostarda} />
          <Nuvem x={30} y={84} escala={0.7} />
          <path d="M0 176 Q90 150 180 172 T300 164 V230 H0Z" fill={COR.folhaClara} />
          <path d="M0 200 Q110 180 210 198 T300 192 V230 H0Z" fill={COR.folha} />
          <path d="M122 190 H178 L170 224 H130Z" fill={COR.laranja} />
          <rect x="116" y="182" width="68" height="12" rx="6" fill={COR.laranjaClara} />
          <path d="M150 182 V122" stroke={COR.mata} strokeWidth="6" strokeLinecap="round" />
          <path d="M150 140 C150 112 124 98 92 100 C92 130 116 142 150 140Z" fill={COR.lima} />
          <path d="M150 124 C150 94 176 78 210 80 C210 112 184 126 150 124Z" fill={COR.folha} />
        </>
      )}
    </Quadro>
  );
}

const DESENHOS: Record<ChaveCategoria, () => ReactNode> = {
  reciclagem: Reciclagem,
  agua: Agua,
  energia: Energia,
  mobilidade: Mobilidade,
  hortas: Hortas,
  mutirao: Mutirao,
  residuos: Residuos,
  padrao: Padrao,
};

/** Ilustração (decorativa) da categoria. O nome da categoria sempre aparece em texto ao lado. */
export function IlustracaoCategoria({ nome }: { nome: string }) {
  const Desenho = DESENHOS[chaveDaCategoria(nome)];
  return <Desenho />;
}

/** Ícone simples de uma cor só (usa a cor do texto). */
export function PictogramaCategoria({ nome, className }: { nome: string; className?: string }) {
  const chave = chaveDaCategoria(nome);
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {chave === 'reciclagem' && (
        <>
          <path d="M10 24 a14 14 0 0 1 24 -10 M35 6 v9 h-9" />
          <path d="M38 24 a14 14 0 0 1 -24 10 M13 42 v-9 h9" />
        </>
      )}
      {chave === 'agua' && <path d="M24 5 C24 5 11 21 11 31 a13 13 0 0 0 26 0 C37 21 24 5 24 5Z" />}
      {chave === 'energia' && <path d="M27 4 L10 27 H22 L19 44 L38 20 H26Z" />}
      {chave === 'mobilidade' && (
        <>
          <circle cx="12" cy="32" r="8" />
          <circle cx="36" cy="32" r="8" />
          <path d="M12 32 L20 16 H30 L36 32 M20 16 L24 32 H12 M16 12 H22 M30 16 L28 10 H33" />
        </>
      )}
      {chave === 'hortas' && (
        <>
          <path d="M24 42 V24" />
          <path d="M24 30 C24 22 18 18 9 18 c0 9 6 12 15 12Z" />
          <path d="M24 25 C24 15 31 9 40 9 c0 10 -7 16 -16 16Z" />
        </>
      )}
      {chave === 'mutirao' && <path d="M10 13 H38 M18 13 V8 H30 V13 M13 13 L16 41 H32 L35 13 M20 20 V34 M28 20 V34" />}
      {chave === 'residuos' && <path d="M11 18 H37 L40 42 H8Z M17 18 V14 a7 7 0 0 1 14 0 V18" />}
      {chave === 'padrao' && <path d="M8 40 C8 18 22 8 40 8 C40 28 30 40 8 40Z M8 40 L28 20" />}
    </svg>
  );
}
