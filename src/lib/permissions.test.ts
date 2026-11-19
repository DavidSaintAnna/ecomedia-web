import { USUARIA, post } from '../test/utils';
import type { AuthUser } from '../api/types';
import { ehAdmin, podeGerenciarPost } from './permissions';

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

describe('ehAdmin', () => {
  it('só quem tem o papel ADMIN', () => {
    expect(ehAdmin({ ...usuaria, role: 'ADMIN' })).toBe(true);
    expect(ehAdmin(usuaria)).toBe(false);
    expect(ehAdmin(null)).toBe(false);
  });
});
