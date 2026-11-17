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
