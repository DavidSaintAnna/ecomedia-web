import { render } from '@testing-library/react';
import { CenaDoBairro } from './CenaDoBairro';
import { chaveDaCategoria, IlustracaoCategoria, PictogramaCategoria, type ChaveCategoria } from './Categorias';
import { Horizonte } from './Horizonte';
import { Marca } from './Marca';

describe('chaveDaCategoria', () => {
  it.each<[string, ChaveCategoria]>([
    ['Reciclagem', 'reciclagem'],
    ['Água', 'agua'],
    ['ÁGUA', 'agua'],
    ['Energia', 'energia'],
    ['Energia solar', 'energia'],
    ['Mobilidade', 'mobilidade'],
    ['Transporte público', 'mobilidade'],
    ['Hortas Urbanas', 'hortas'],
    ['Hortas comunitárias', 'hortas'],
    ['Mutirão de Limpeza', 'mutirao'],
    ['Redução de Resíduos', 'residuos'],
    ['Compostagem', 'residuos'],
    ['Música', 'padrao'],
    ['', 'padrao'],
  ])('"%s" usa o desenho "%s"', (nome, chave) => {
    expect(chaveDaCategoria(nome)).toBe(chave);
  });
});

describe('ilustrações', () => {
  const nomes = ['Reciclagem', 'Água', 'Energia', 'Mobilidade', 'Hortas Urbanas', 'Mutirão de Limpeza', 'Redução de Resíduos', 'Qualquer coisa nova'];

  it.each(nomes)('a ilustração e o ícone de "%s" são enfeite (escondidos de leitores de tela)', (nome) => {
    const { container } = render(
      <>
        <IlustracaoCategoria nome={nome} />
        <PictogramaCategoria nome={nome} />
      </>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg.querySelector('title')).toBeNull();
    }
  });

  it('as cenas e o símbolo também são decorativos', () => {
    const { container } = render(
      <>
        <CenaDoBairro />
        <Horizonte />
        <Marca />
      </>,
    );
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('duas ilustrações na mesma página não repartem o mesmo id de filtro (o grão de uma não some quando a outra sai)', () => {
    const { container } = render(
      <>
        <IlustracaoCategoria nome="Água" />
        <IlustracaoCategoria nome="Água" />
        <CenaDoBairro />
      </>,
    );
    const ids = [...container.querySelectorAll('filter')].map((f) => f.id);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
  });
});
