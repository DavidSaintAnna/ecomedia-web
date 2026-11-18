import { describe, expect, it } from 'vitest';
import { calcularRecorte, ehFotoEnviada } from './imagem';

describe('calcularRecorte', () => {
  it('diminui mantendo a proporção, pelo maior lado', () => {
    expect(calcularRecorte(4000, 3000, { ladoMaximo: 1280 }).destino).toEqual({ largura: 1280, altura: 960 });
    expect(calcularRecorte(3000, 4000, { ladoMaximo: 1280 }).destino).toEqual({ largura: 960, altura: 1280 });
  });

  it('nunca aumenta uma foto que já é pequena', () => {
    const r = calcularRecorte(800, 600, { ladoMaximo: 1280 });
    expect(r.destino).toEqual({ largura: 800, altura: 600 });
    expect(r.origem).toEqual({ x: 0, y: 0, largura: 800, altura: 600 });
  });

  it('foto de perfil: recorta um quadrado no centro e reduz', () => {
    const r = calcularRecorte(4000, 3000, { ladoMaximo: 256, quadrada: true });
    expect(r.origem).toEqual({ x: 500, y: 0, largura: 3000, altura: 3000 });
    expect(r.destino).toEqual({ largura: 256, altura: 256 });
    const alta = calcularRecorte(600, 1000, { ladoMaximo: 256, quadrada: true });
    expect(alta.origem).toEqual({ x: 0, y: 200, largura: 600, altura: 600 });
  });

  it('foto de perfil pequena fica no tamanho que tem', () => {
    expect(calcularRecorte(100, 80, { ladoMaximo: 256, quadrada: true }).destino).toEqual({ largura: 80, altura: 80 });
  });

  it('imagem muito comprida não vira 0 pixel', () => {
    expect(calcularRecorte(10000, 2, { ladoMaximo: 1280 }).destino).toEqual({ largura: 1280, altura: 1 });
  });
});

describe('ehFotoEnviada', () => {
  const api = 'https://ecomedia-api.onrender.com';
  it('reconhece só as fotos guardadas na nossa API', () => {
    expect(ehFotoEnviada(`${api}/api/images/12`, api)).toBe(true);
    expect(ehFotoEnviada('https://outro.com/api/images/12', api)).toBe(false);
    expect(ehFotoEnviada(`${api}/api/images/abc`, api)).toBe(false);
    expect(ehFotoEnviada('https://exemplo.com/foto.jpg', api)).toBe(false);
    expect(ehFotoEnviada('lixo', api)).toBe(false);
  });
});
