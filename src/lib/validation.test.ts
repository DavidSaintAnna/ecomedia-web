import { ApiError } from '../api/client';
import { errosDaApi, validarCadastro, validarEntrada } from './validation';

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
