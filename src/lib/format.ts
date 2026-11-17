const numero = new Intl.NumberFormat('pt-BR');

/** plural(1, 'curtida', 'curtidas') → "1 curtida"; plural(1234, ...) → "1.234 curtidas" */
export function plural(n: number, singular: string, pluralForma: string): string {
  return `${numero.format(n)} ${n === 1 ? singular : pluralForma}`;
}
