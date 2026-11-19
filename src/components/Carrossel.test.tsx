import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Carrossel } from './Carrossel';

// O jsdom não calcula tamanhos nem rola nada: aqui os tamanhos são combinados e o scrollBy é espiado.
function combinarTamanhos(largura: number, conteudo: number) {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(largura);
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(conteudo);
}

let scrollBy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  scrollBy = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, writable: true, value: scrollBy });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
});

function desenhar() {
  return render(
    <Carrossel titulo="Novidades" descricao="Veja o que chegou" rotuloAnterior="Voltar" rotuloProximo="Avançar">
      <div role="group" aria-roledescription="slide" aria-label="1 de 3">
        um
      </div>
      <div role="group" aria-roledescription="slide" aria-label="2 de 3">
        dois
      </div>
      <div role="group" aria-roledescription="slide" aria-label="3 de 3">
        três
      </div>
    </Carrossel>,
  );
}

describe('Carrossel', () => {
  it('é uma região com nome, descrita como carrossel', () => {
    combinarTamanhos(300, 900);
    desenhar();
    const regiao = screen.getByRole('region', { name: 'Novidades' });
    expect(regiao).toHaveAttribute('aria-roledescription', 'carrossel');
    expect(screen.getByText('Veja o que chegou')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /de 3$/ })).toHaveLength(3);
  });

  it('esconde os botões quando todos os slides já cabem na tela', () => {
    combinarTamanhos(900, 900);
    desenhar();
    expect(screen.queryByRole('button', { name: 'Avançar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument();
  });

  it('no começo só dá para avançar; avançar rola uma "página" e, no fim, só dá para voltar', async () => {
    combinarTamanhos(300, 900);
    desenhar();
    const voltar = screen.getByRole('button', { name: 'Voltar' });
    const avancar = screen.getByRole('button', { name: 'Avançar' });
    expect(voltar).toBeDisabled();
    expect(avancar).toBeEnabled();

    await userEvent.click(avancar);
    expect(scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });

    // a pista chegou ao fim: o navegador avisa com o evento de rolagem
    const pista = document.getElementById(avancar.getAttribute('aria-controls')!)!;
    Object.defineProperty(pista, 'scrollLeft', { configurable: true, value: 600 });
    fireEvent.scroll(pista);
    expect(voltar).toBeEnabled();
    expect(avancar).toBeDisabled();

    await userEvent.click(voltar);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -300, behavior: 'smooth' });
  });

  it('quem pede menos movimento no sistema não vê rolagem animada', async () => {
    combinarTamanhos(300, 900);
    vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: consulta.includes('reduce'), media: consulta }));
    desenhar();
    await userEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 300, behavior: 'auto' });
  });

  it('os botões apontam para a pista que controlam', () => {
    combinarTamanhos(300, 900);
    desenhar();
    const id = screen.getByRole('button', { name: 'Avançar' }).getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toContainElement(screen.getByRole('group', { name: '1 de 3' }));
  });
});
