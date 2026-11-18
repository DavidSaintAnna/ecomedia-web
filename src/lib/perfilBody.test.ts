import type { AuthUser } from '../api/types';
import { USUARIA } from '../test/utils';
import { corpoPerfil, valoresDoPerfil } from './perfilBody';

const completo = { ...USUARIA, bio: 'Gosto de plantas', avatarUrl: 'https://x.com/a.jpg' } as AuthUser;

describe('corpoPerfil', () => {
  it('sem mudanças o corpo é vazio (mesmo com espaços nas pontas)', () => {
    const v = valoresDoPerfil(completo);
    expect(corpoPerfil(completo, v)).toEqual({});
    expect(corpoPerfil(completo, { ...v, name: `  ${v.name}  `, city: ` ${v.city} ` })).toEqual({});
  });

  it('manda só o que mudou', () => {
    const v = valoresDoPerfil(completo);
    expect(corpoPerfil(completo, { ...v, name: 'Mariana Souza' })).toEqual({ name: 'Mariana Souza' });
    expect(corpoPerfil(completo, { ...v, bio: 'Outra bio' })).toEqual({ bio: 'Outra bio' });
  });

  it('cidade, apresentação e foto apagadas viram null', () => {
    const v = valoresDoPerfil(completo);
    expect(corpoPerfil(completo, { ...v, city: '', bio: '  ', avatarUrl: '' })).toEqual({ city: null, bio: null, avatarUrl: null });
  });

  it('não manda null para campo que já era vazio', () => {
    const vazio = { ...USUARIA, city: null, bio: null, avatarUrl: null } as AuthUser;
    expect(corpoPerfil(vazio, valoresDoPerfil(vazio))).toEqual({});
  });
});
