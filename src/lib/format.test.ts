import { plural } from './format';

describe('plural', () => {
  it('singular só para 1', () => {
    expect(plural(0, 'curtida', 'curtidas')).toBe('0 curtidas');
    expect(plural(1, 'curtida', 'curtidas')).toBe('1 curtida');
    expect(plural(2, 'curtida', 'curtidas')).toBe('2 curtidas');
  });

  it('separa milhares no padrão brasileiro', () => {
    expect(plural(1234, 'comentário', 'comentários')).toBe('1.234 comentários');
  });
});
