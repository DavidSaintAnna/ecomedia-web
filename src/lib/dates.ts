// A API devolve datas em UTC (ex.: 2026-11-17T09:06:33.404Z). O fuso fixo de Brasília faz a tela
// mostrar o mesmo horário para qualquer visitante, e os testes darem igual em qualquer computador.
const FUSO = 'America/Sao_Paulo';

/** 17/11/2026, 06:06 */
export function dataBR(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: FUSO,
  }).format(new Date(iso));
}

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** há 3 horas, ontem, há 5 dias... */
export function haQuanto(iso: string, agora = Date.now()): string {
  const seg = Math.round((new Date(iso).getTime() - agora) / 1000);
  const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unidade, s] of unidades) {
    if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), unidade);
  }
  return 'agora';
}

const SETE_DIAS = 7 * 86400;

/** Até 7 dias mostra "há 3 horas"; depois mostra a data completa. */
export function quando(iso: string, agora = Date.now()): string {
  const seg = Math.abs(new Date(iso).getTime() - agora) / 1000;
  return seg <= SETE_DIAS ? haQuanto(iso, agora) : dataBR(iso);
}
