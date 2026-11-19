import type { ApiError } from '../api/client';

export type Erros = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe seu e-mail.';
  if (!EMAIL.test(email.trim())) return 'Digite um e-mail válido, como nome@exemplo.com.';
  return undefined;
}

function limpar(erros: Record<string, string | undefined>): Erros {
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem)) as Erros;
}

export function validarEntrada(v: { email: string; password: string }): Erros {
  return limpar({
    email: validarEmail(v.email),
    password: v.password ? undefined : 'Informe sua senha.',
  });
}

// As mesmas regras da API (nome 2 a 100, senha 8 a 72, cidade até 100), com mensagens em português.
export function validarCadastro(v: { name: string; email: string; password: string; city: string }): Erros {
  const nome = v.name.trim();
  return limpar({
    name: nome.length < 2 ? 'Informe seu nome (pelo menos 2 letras).' : nome.length > 100 ? 'O nome pode ter no máximo 100 letras.' : undefined,
    email: validarEmail(v.email),
    password: !v.password
      ? 'Informe uma senha.'
      : v.password.length < 8
        ? 'A senha precisa ter pelo menos 8 caracteres.'
        : v.password.length > 72
          ? 'A senha pode ter no máximo 72 caracteres.'
          : undefined,
    city: v.city.trim().length > 100 ? 'A cidade pode ter no máximo 100 letras.' : undefined,
  });
}

/** Leva o que a API disse sobre cada campo (details[].path) para o campo certo. E-mail repetido (409) vai para o campo e-mail. */
export function errosDaApi(erro: ApiError, campos: string[]): Erros {
  const resultado: Erros = {};
  for (const d of erro.details) {
    if (campos.includes(d.path) && !resultado[d.path]) resultado[d.path] = d.message;
  }
  if (erro.status === 409 && campos.includes('email')) resultado.email = erro.message;
  return resultado;
}

export const COMENTARIO_MINIMO = 10;
export const COMENTARIO_MAXIMO = 500;

/** Mesma regra da API: de 10 a 500 caracteres, sem contar espaços nas pontas. */
export function validarComentario(texto: string): string | undefined {
  const t = texto.trim();
  if (!t) return 'Escreva alguma coisa antes de enviar.';
  if (t.length < COMENTARIO_MINIMO) return `O comentário precisa ter pelo menos ${COMENTARIO_MINIMO} caracteres.`;
  if (t.length > COMENTARIO_MAXIMO) return `O comentário pode ter no máximo ${COMENTARIO_MAXIMO} caracteres.`;
  return undefined;
}

export function linkValido(texto: string): boolean {
  try {
    const url = new URL(texto);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const POST_MINIMO = 10;
export const POST_MAXIMO = 1000;

// As mesmas regras da API: categoria obrigatória, texto de 10 a 1000, imagem (opcional) com link http(s) de até 500, cidade até 100.
export function validarPost(v: { categoryId: string; content: string; imageUrl: string; city: string }): Erros {
  const texto = v.content.trim();
  const imagem = v.imageUrl.trim();
  return limpar({
    categoryId: v.categoryId ? undefined : 'Escolha uma categoria.',
    content:
      texto.length < POST_MINIMO
        ? `A publicação precisa ter pelo menos ${POST_MINIMO} caracteres.`
        : texto.length > POST_MAXIMO
          ? `A publicação pode ter no máximo ${POST_MAXIMO} caracteres.`
          : undefined,
    imageUrl: !imagem
      ? undefined
      : imagem.length > 500
        ? 'O link da imagem pode ter no máximo 500 caracteres.'
        : !linkValido(imagem)
          ? 'Digite um link válido, começando com http:// ou https://.'
          : undefined,
    city: v.city.trim().length > 100 ? 'A cidade pode ter no máximo 100 letras.' : undefined,
  });
}

export const BIO_MAXIMO = 500;

// As mesmas regras da API: nome de 2 a 100, cidade até 100, apresentação até 500, foto (opcional) com link http(s) de até 500.
export function validarPerfil(v: { name: string; city: string; bio: string; avatarUrl: string }): Erros {
  const nome = v.name.trim();
  const foto = v.avatarUrl.trim();
  return limpar({
    name: nome.length < 2 ? 'Informe seu nome (pelo menos 2 letras).' : nome.length > 100 ? 'O nome pode ter no máximo 100 letras.' : undefined,
    city: v.city.trim().length > 100 ? 'A cidade pode ter no máximo 100 letras.' : undefined,
    bio: v.bio.trim().length > BIO_MAXIMO ? `A apresentação pode ter no máximo ${BIO_MAXIMO} caracteres.` : undefined,
    avatarUrl: !foto
      ? undefined
      : foto.length > 500
        ? 'O link da foto pode ter no máximo 500 caracteres.'
        : !linkValido(foto)
          ? 'Digite um link válido, começando com http:// ou https://.'
          : undefined,
  });
}

export const CATEGORIA_NOME_MINIMO = 2;
export const CATEGORIA_NOME_MAXIMO = 60;
export const CATEGORIA_DESCRICAO_MAXIMA = 300;

/** Mesmas regras da API: nome de 2 a 60 caracteres, descrição (opcional) de até 300. */
export function validarCategoria(v: { name: string; description: string }): Erros {
  const nome = v.name.trim();
  return limpar({
    name:
      nome.length < CATEGORIA_NOME_MINIMO
        ? `O nome precisa ter pelo menos ${CATEGORIA_NOME_MINIMO} letras.`
        : nome.length > CATEGORIA_NOME_MAXIMO
          ? `O nome pode ter no máximo ${CATEGORIA_NOME_MAXIMO} letras.`
          : undefined,
    description:
      v.description.trim().length > CATEGORIA_DESCRICAO_MAXIMA
        ? `A descrição pode ter no máximo ${CATEGORIA_DESCRICAO_MAXIMA} caracteres.`
        : undefined,
  });
}
