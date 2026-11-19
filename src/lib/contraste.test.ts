import { readFileSync } from 'node:fs';
import { contraste, lerCoresDoCss, luminancia } from './contraste';

// Lê o arquivo direto do disco (o Vitest não processa CSS nesta configuração). O npm test roda sempre na pasta do projeto.
const css = readFileSync('src/styles.css', 'utf8');

describe('contraste', () => {
  it('preto sobre branco é 21 e a ordem das cores não muda o resultado', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('cores iguais têm contraste 1', () => {
    expect(contraste('#c6f135', '#c6f135')).toBeCloseTo(1, 5);
  });

  it('a luminância vai de 0 (preto) a 1 (branco)', () => {
    expect(luminancia('#000000')).toBe(0);
    expect(luminancia('#ffffff')).toBeCloseTo(1, 5);
  });

  it('recusa cor mal escrita', () => {
    expect(() => luminancia('verde')).toThrow('Cor inválida');
  });
});

// A paleta mora em :root do styles.css. Este teste lê o arquivo de verdade: se alguém trocar uma cor por outra
// que deixe um texto ilegível, ele falha. O lima nunca aparece como texto sobre fundo claro (1,2:1), só como fundo.
describe('paleta do site (styles.css)', () => {
  const cores = lerCoresDoCss(css);

  it('encontrou as cores principais', () => {
    for (const nome of ['creme', 'papel', 'tinta', 'floresta', 'lima', 'laranja', 'erro']) expect(cores[nome]).toBeDefined();
  });

  // [texto ou traço, fundo, mínimo]: 4,5 para texto comum (AA) e 3 para contornos de botões e campos
  const pares: [string, string, number][] = [
    ['tinta', 'creme', 4.5],
    ['tinta', 'papel', 4.5],
    ['tinta', 'areia', 4.5],
    ['tinta', 'lima-suave', 4.5],
    ['tinta', 'aviso-fundo', 4.5],
    ['tinta', 'laranja', 4.5],
    ['tinta-suave', 'creme', 4.5],
    ['tinta-suave', 'papel', 4.5],
    ['tinta-suave', 'areia', 4.5],
    ['tinta-suave', 'lima-suave', 4.5],
    ['floresta', 'creme', 4.5],
    ['floresta', 'papel', 4.5],
    ['floresta', 'lima', 4.5],
    ['floresta', 'lima-suave', 4.5],
    ['creme', 'floresta', 4.5],
    ['papel', 'floresta', 4.5],
    ['creme', 'floresta-escura', 4.5],
    ['sobre-escuro', 'floresta', 4.5],
    ['sobre-escuro', 'floresta-escura', 4.5],
    ['lima', 'floresta', 4.5],
    ['lima', 'floresta-escura', 4.5],
    ['link', 'creme', 4.5],
    ['link', 'papel', 4.5],
    ['link', 'lima-suave', 4.5],
    ['erro', 'creme', 4.5],
    ['erro', 'papel', 4.5],
    ['erro', 'erro-fundo', 4.5],
    ['papel', 'erro', 4.5],
    ['contorno', 'papel', 3],
    ['contorno', 'creme', 3],
    ['floresta', 'lima', 3],
  ];

  it.each(pares)('%s sobre %s tem contraste de pelo menos %s:1', (texto, fundo, minimo) => {
    expect(cores[texto], `falta --${texto}`).toBeDefined();
    expect(cores[fundo], `falta --${fundo}`).toBeDefined();
    expect(contraste(cores[texto], cores[fundo])).toBeGreaterThanOrEqual(minimo);
  });
});
