import { ApiError } from '../api/client';
import { errosDaApi, validarCadastro, validarEntrada, validarComentario, validarPerfil, validarPost } from './validation';

describe('validarCadastro', () => {
  const ok = { name: 'Maria Souza', email: 'maria@exemplo.com', password: '12345678', city: '' };

  it('aceita dados corretos, com cidade vazia', () => {
    expect(validarCadastro(ok)).toEqual({});
  });

  it('marca nome curto, e-mail inválido e senha curta', () => {
    const erros = validarCadastro({ name: 'M', email: 'maria', password: '1234567', city: '' });
    expect(erros.name).toMatch(/pelo menos 2/);
    expect(erros.email).toMatch(/e-mail válido/);
    expect(erros.password).toBe('A senha precisa ter pelo menos 8 caracteres.');
  });

  it('marca senha longa demais (a API aceita até 72)', () => {
    expect(validarCadastro({ ...ok, password: 'a'.repeat(73) }).password).toMatch(/no máximo 72/);
    expect(validarCadastro({ ...ok, password: 'a'.repeat(72) }).password).toBeUndefined();
  });
});

describe('validarEntrada', () => {
  it('exige e-mail e senha', () => {
    expect(validarEntrada({ email: '', password: '' })).toEqual({ email: 'Informe seu e-mail.', password: 'Informe sua senha.' });
  });
});

describe('errosDaApi', () => {
  it('leva details para os campos conhecidos', () => {
    const erro = new ApiError(400, 'ValidationError', 'Dados da requisição inválidos', [
      { path: 'email', message: 'Formato do endereço de e-mail inválido' },
      { path: 'outro', message: 'ignorado' },
    ]);
    expect(errosDaApi(erro, ['email', 'password'])).toEqual({ email: 'Formato do endereço de e-mail inválido' });
  });

  it('leva o 409 de e-mail repetido para o campo e-mail', () => {
    const erro = new ApiError(409, 'Conflict', 'E-mail já cadastrado');
    expect(errosDaApi(erro, ['name', 'email'])).toEqual({ email: 'E-mail já cadastrado' });
  });
});

describe('validarPost', () => {
  const ok = { categoryId: '1', content: 'Plantamos uma horta', imageUrl: '', city: '' };

  it('aceita o mínimo: categoria e texto', () => {
    expect(validarPost(ok)).toEqual({});
  });

  it('exige categoria e texto com pelo menos 3 caracteres', () => {
    expect(validarPost({ ...ok, categoryId: '', content: ' ab ' })).toEqual({
      categoryId: 'Escolha uma categoria.',
      content: 'A publicação precisa ter pelo menos 10 caracteres.',
    });
  });

  it('pede no mínimo 10 caracteres, sem contar espaços nas pontas', () => {
    expect(validarPost({ ...ok, content: '  Reciclei!  ' }).content).toBe('A publicação precisa ter pelo menos 10 caracteres.');
    expect(validarPost({ ...ok, content: '123456789' }).content).toMatch(/pelo menos 10/);
    expect(validarPost({ ...ok, content: '  1234567890  ' })).toEqual({});
  });

  it('limita o texto a 1000 caracteres', () => {
    expect(validarPost({ ...ok, content: 'a'.repeat(1001) }).content).toMatch(/no máximo 1000/);
    expect(validarPost({ ...ok, content: 'a'.repeat(1000) })).toEqual({});
  });

  it('só aceita link http ou https na imagem', () => {
    expect(validarPost({ ...ok, imageUrl: 'https://x.com/a.png' })).toEqual({});
    expect(validarPost({ ...ok, imageUrl: 'http://x.com/a.png' })).toEqual({});
    expect(validarPost({ ...ok, imageUrl: 'abc' }).imageUrl).toMatch(/link válido/);
    expect(validarPost({ ...ok, imageUrl: 'ftp://x.com/a.png' }).imageUrl).toMatch(/link válido/);
    expect(validarPost({ ...ok, imageUrl: `https://x.com/${'a'.repeat(500)}` }).imageUrl).toMatch(/500/);
  });

  it('cidade com até 100 letras', () => {
    expect(validarPost({ ...ok, city: 'a'.repeat(101) }).city).toMatch(/100/);
  });
});

describe('validarComentario', () => {
  it('exige de 10 a 500 caracteres, sem contar espaços nas pontas', () => {
    expect(validarComentario('')).toBe('Escreva alguma coisa antes de enviar.');
    expect(validarComentario('   ')).toBe('Escreva alguma coisa antes de enviar.');
    expect(validarComentario('  Parabéns!  ')).toBe('O comentário precisa ter pelo menos 10 caracteres.');
    expect(validarComentario('123456789')).toMatch(/pelo menos 10/);
    expect(validarComentario('1234567890')).toBeUndefined();
    expect(validarComentario('a'.repeat(500))).toBeUndefined();
    expect(validarComentario('a'.repeat(501))).toBe('O comentário pode ter no máximo 500 caracteres.');
  });
});

describe('validarPerfil', () => {
  const ok = { name: 'Maria Souza', city: '', bio: '', avatarUrl: '' };

  it('aceita o mínimo: só o nome', () => {
    expect(validarPerfil(ok)).toEqual({});
  });

  it('nome de 2 a 100 letras', () => {
    expect(validarPerfil({ ...ok, name: ' a ' }).name).toMatch(/pelo menos 2/);
    expect(validarPerfil({ ...ok, name: 'a'.repeat(101) }).name).toMatch(/no máximo 100/);
  });

  it('cidade até 100 e apresentação até 500', () => {
    expect(validarPerfil({ ...ok, city: 'a'.repeat(101) }).city).toMatch(/100/);
    expect(validarPerfil({ ...ok, bio: 'a'.repeat(501) }).bio).toMatch(/500/);
    expect(validarPerfil({ ...ok, bio: 'a'.repeat(500) })).toEqual({});
  });

  it('foto: só link http ou https', () => {
    expect(validarPerfil({ ...ok, avatarUrl: 'https://x.com/a.png' })).toEqual({});
    expect(validarPerfil({ ...ok, avatarUrl: 'abc' }).avatarUrl).toMatch(/link válido/);
    expect(validarPerfil({ ...ok, avatarUrl: 'javascript:alert(1)' }).avatarUrl).toMatch(/link válido/);
  });
});
