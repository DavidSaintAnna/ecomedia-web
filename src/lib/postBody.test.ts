import { post } from '../test/utils';
import { corpoEdicao, corpoNovo, valoresIniciais } from './postBody';

const vazio = { categoryId: '2', content: '  Horta no bairro  ', imageUrl: '', city: '   ' };

describe('corpoNovo', () => {
  it('tira os espaços e deixa de fora imagem e cidade vazias', () => {
    expect(corpoNovo(vazio)).toEqual({ categoryId: 2, content: 'Horta no bairro' });
  });

  it('inclui imagem e cidade quando preenchidas', () => {
    expect(corpoNovo({ ...vazio, imageUrl: ' https://x.com/a.jpg ', city: ' Recife ' })).toEqual({
      categoryId: 2,
      content: 'Horta no bairro',
      imageUrl: 'https://x.com/a.jpg',
      city: 'Recife',
    });
  });
});

describe('corpoEdicao', () => {
  const original = post(5, { imageUrl: 'https://x.com/a.jpg', city: 'Fortaleza' });
  const iguais = valoresIniciais(original);

  it('sem mudanças o corpo é vazio', () => {
    expect(corpoEdicao(original, iguais)).toEqual({});
    expect(corpoEdicao(original, { ...iguais, content: `  ${original.content}  ` })).toEqual({});
  });

  it('manda só o que mudou', () => {
    expect(corpoEdicao(original, { ...iguais, content: 'Novo texto' })).toEqual({ content: 'Novo texto' });
    expect(corpoEdicao(original, { ...iguais, categoryId: '3' })).toEqual({ categoryId: 3 });
  });

  it('imagem e cidade apagadas viram null', () => {
    expect(corpoEdicao(original, { ...iguais, imageUrl: '', city: ' ' })).toEqual({ imageUrl: null, city: null });
  });

  it('não manda null para campo que já era vazio', () => {
    const sem = post(6, { imageUrl: null, city: null });
    expect(corpoEdicao(sem, valoresIniciais(sem))).toEqual({});
  });
});
