import { describe, expect, it } from 'vitest';
import { dimensoesReduzidas } from './normalizarFoto';

describe('dimensoesReduzidas (CA7)', () => {
  it('foto de 12 MP em retrato cai para 2160 px no lado maior, mantendo a proporção', () => {
    expect(dimensoesReduzidas(3024, 4032)).toEqual({ largura: 1620, altura: 2160 });
  });

  it('foto menor que o limite não é ampliada', () => {
    expect(dimensoesReduzidas(1080, 1350)).toEqual({ largura: 1080, altura: 1350 });
  });
});
