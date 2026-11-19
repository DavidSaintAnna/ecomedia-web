// Símbolo da EcoMedia: um broto (duas folhas) dentro de um círculo. Decorativo: o nome "EcoMedia" vem sempre escrito ao lado.
export function Marca({ invertida = false, className = 'marca-simbolo' }: { invertida?: boolean; className?: string }) {
  const fundo = invertida ? '#c6f135' : '#0b3d2e';
  const folha = invertida ? '#0b3d2e' : '#c6f135';
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="20" fill={fundo} />
      <path d="M20 31V19" stroke={folha} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 21.5C20 15.5 15.5 12 9 12c0 6.200 4 9.500 11 9.500Z" fill={folha} />
      <path d="M20 18.500C20 12.500 24.500 8.500 31.500 8.500c0 7-4.500 10-11.500 10Z" fill={folha} />
    </svg>
  );
}
