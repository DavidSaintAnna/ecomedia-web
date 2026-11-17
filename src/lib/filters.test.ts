import { lerFiltros, paraParams, temFiltro } from './filters';

describe('lerFiltros', () => {
  it('lê os filtros do endereço', () => {
    const f = lerFiltros(new URLSearchParams('q=horta&city=Fortaleza&categoryId=3&page=2'));
    expect(f).toEqual({ q: 'horta', city: 'Fortaleza', categoryId: '3', page: 2 });
  });

  it('valores estranhos viram "sem filtro", para a API nunca receber um 400', () => {
    const f = lerFiltros(new URLSearchParams('q=%20%20&city=&categoryId=0&page=abc'));
    expect(f).toEqual({ q: '', city: '', categoryId: '', page: 1 });
    expect(lerFiltros(new URLSearchParams('page=0&categoryId=-1')).page).toBe(1);
    expect(lerFiltros(new URLSearchParams('page=1.5&categoryId=1e3'))).toMatchObject({ page: 1, categoryId: '' });
  });
});

describe('paraParams', () => {
  it('omite filtros vazios e page=1', () => {
    expect(paraParams({ q: ' ', city: '', categoryId: '', page: 1 }).toString()).toBe('');
    expect(paraParams({ q: ' horta ', categoryId: '3', page: 2 }).toString()).toBe('q=horta&categoryId=3&page=2');
  });
});

describe('temFiltro', () => {
  it('página sozinha não conta como filtro', () => {
    expect(temFiltro({ q: '', city: '', categoryId: '', page: 3 })).toBe(false);
    expect(temFiltro({ q: 'a', city: '', categoryId: '', page: 1 })).toBe(true);
  });
});
