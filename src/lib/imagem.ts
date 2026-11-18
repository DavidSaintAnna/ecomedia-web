// Prepara uma foto do computador para o envio: reduz o tamanho (largura e altura) e comprime,
// para ela ocupar pouco no banco de dados e carregar rápido. Tudo acontece no navegador.

export const TAMANHO_MAXIMO_ENVIO = 512 * 1024; // o mesmo limite da API
export const TAMANHO_MAXIMO_ORIGINAL = 20 * 1024 * 1024; // fotos de celular têm de 3 a 10 MB

export interface OpcoesDeReducao {
  /** Maior lado da imagem final, em pixels. */
  ladoMaximo: number;
  /** true = recorta um quadrado no centro (foto de perfil). */
  quadrada?: boolean;
}

export const FOTO_DE_PERFIL: OpcoesDeReducao = { ladoMaximo: 256, quadrada: true };
export const FOTO_DE_PUBLICACAO: OpcoesDeReducao = { ladoMaximo: 1280 };

export interface Recorte {
  /** Parte da imagem original que será usada. */
  origem: { x: number; y: number; largura: number; altura: number };
  /** Tamanho da imagem final. */
  destino: { largura: number; altura: number };
}

// Conta pura (sem canvas), por isso dá para testar: nunca aumenta a imagem, só diminui.
export function calcularRecorte(largura: number, altura: number, { ladoMaximo, quadrada }: OpcoesDeReducao): Recorte {
  if (quadrada) {
    const lado = Math.min(largura, altura);
    const final = Math.min(lado, ladoMaximo);
    return {
      origem: { x: Math.round((largura - lado) / 2), y: Math.round((altura - lado) / 2), largura: lado, altura: lado },
      destino: { largura: final, altura: final },
    };
  }
  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));
  return {
    origem: { x: 0, y: 0, largura, altura },
    destino: { largura: Math.max(1, Math.round(largura * escala)), altura: Math.max(1, Math.round(altura * escala)) },
  };
}

export class ErroDeImagem extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErroDeImagem';
  }
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

// Lê o arquivo, desenha numa tela (canvas) menor e devolve os bytes comprimidos (WebP; JPEG se o navegador não souber WebP).
export async function reduzirImagem(arquivo: File, opcoes: OpcoesDeReducao): Promise<Blob> {
  if (!arquivo.type.startsWith('image/') || arquivo.type === 'image/svg+xml') {
    throw new ErroDeImagem('Esse arquivo não é uma foto. Escolha uma imagem PNG, JPEG ou WebP.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) {
    throw new ErroDeImagem('Essa foto é grande demais (máximo de 20 MB). Escolha uma menor.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo); // já aplica a rotação das fotos de celular
  } catch {
    throw new ErroDeImagem('Não consegui abrir essa foto. Tente outro arquivo (PNG, JPEG ou WebP).');
  }

  try {
    const recorte = calcularRecorte(bitmap.width, bitmap.height, opcoes);
    const canvas = document.createElement('canvas');
    canvas.width = recorte.destino.largura;
    canvas.height = recorte.destino.altura;
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new ErroDeImagem('Seu navegador não conseguiu preparar a foto.');
    const { origem, destino } = recorte;
    contexto.drawImage(bitmap, origem.x, origem.y, origem.largura, origem.altura, 0, 0, destino.largura, destino.altura);

    // tenta qualidades cada vez menores até caber no limite do envio
    for (const qualidade of [0.85, 0.7, 0.55, 0.4]) {
      let blob = await paraBlob(canvas, 'image/webp', qualidade);
      if (!blob || blob.type !== 'image/webp') {
        // navegador sem WebP: JPEG não tem transparência, então o fundo vira branco
        contexto.globalCompositeOperation = 'destination-over';
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        blob = await paraBlob(canvas, 'image/jpeg', qualidade);
      }
      if (blob && blob.size <= TAMANHO_MAXIMO_ENVIO) return blob;
    }
    throw new ErroDeImagem('Não consegui deixar essa foto pequena o bastante. Tente outra.');
  } finally {
    bitmap.close();
  }
}

// O link devolvido pela API para uma foto enviada daqui (e não de outro site)?
export function ehFotoEnviada(link: string, apiUrl: string): boolean {
  try {
    const url = new URL(link);
    return url.origin === new URL(apiUrl).origin && /^\/api\/images\/\d+$/.test(url.pathname);
  } catch {
    return false;
  }
}
