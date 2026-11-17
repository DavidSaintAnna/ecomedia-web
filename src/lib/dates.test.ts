import { dataBR, haQuanto, quando } from './dates';

const AGORA = Date.parse('2026-11-17T12:00:00.000Z');

describe('dataBR', () => {
  it('converte UTC para o horário de Brasília', () => {
    expect(dataBR('2026-11-17T09:06:33.404Z')).toBe('17/11/2026, 06:06');
  });

  it('volta para o dia anterior quando passa da meia-noite UTC', () => {
    expect(dataBR('2026-11-17T02:30:00.000Z')).toBe('16/11/2026, 23:30');
  });
});

describe('haQuanto', () => {
  it('horas', () => {
    expect(haQuanto('2026-11-17T09:06:33.404Z', AGORA)).toBe('há 3 horas');
    expect(haQuanto('2026-11-17T02:30:00.000Z', AGORA)).toBe('há 9 horas');
  });

  it('ontem e anteontem', () => {
    expect(haQuanto('2026-11-16T12:00:00.000Z', AGORA)).toBe('ontem');
    expect(haQuanto('2026-11-15T12:00:00.000Z', AGORA)).toBe('anteontem');
  });

  it('dias', () => {
    expect(haQuanto('2026-11-12T12:00:00.000Z', AGORA)).toBe('há 5 dias');
  });

  it('agora, para menos de um minuto', () => {
    expect(haQuanto('2026-11-17T11:59:40.000Z', AGORA)).toBe('agora');
  });
});

describe('quando', () => {
  it('relativo até 7 dias, data completa depois', () => {
    expect(quando('2026-11-14T12:00:00.000Z', AGORA)).toBe('há 3 dias');
    expect(quando('2026-11-01T15:00:00.000Z', AGORA)).toBe('01/11/2026, 12:00');
  });
});
