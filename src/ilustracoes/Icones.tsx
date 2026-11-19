// Setas desenhadas à mão (traço da cor do texto). Sempre decorativas: o botão ou link já tem nome em texto.
const traco = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.600, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function SetaDiagonal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...traco}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SetaEsquerda({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...traco}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function SetaDireita({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...traco}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
