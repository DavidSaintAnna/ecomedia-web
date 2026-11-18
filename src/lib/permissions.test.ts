import { USUARIA, post } from '../test/utils';
import type { AuthUser } from '../api/types';
import { podeGerenciarPost } from './permissions';

const usuaria = USUARIA as AuthUser;

describe('podeGerenciarPost', () => {
  it('o autor pode', () => {
    expect(podeGerenciarPost(usuaria, post(1, { author: { id: 7, name: 'Maria', avatarUrl: null } }))).toBe(true);
  });
  it('outra pessoa não pode', () => {
    expect(podeGerenciarPost(usuaria, post(1))).toBe(false);
  });
  it('o admin pode em qualquer post', () => {
    expect(podeGerenciarPost({ ...usuaria, id: 1, role: 'ADMIN' }, post(1))).toBe(true);
  });
  it('visitante não pode', () => {
    expect(podeGerenciarPost(null, post(1))).toBe(false);
  });
});
