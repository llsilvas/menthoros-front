import { describe, it, expect } from 'vitest';
import { validate } from './accessFormValidation';

describe('validate (AccessForm)', () => {
  it('não acusa erro para entrada válida', () => {
    expect(validate('Maria', 'maria@exemplo.com', '15')).toEqual({});
  });

  it('exige nome', () => {
    expect(validate('  ', 'maria@exemplo.com', '15').nome).toBeDefined();
  });

  it('exige email válido', () => {
    expect(validate('Maria', 'invalido', '15').email).toBeDefined();
    expect(validate('Maria', 'a@b', '15').email).toBeDefined();
  });

  it('rejeita número de atletas inválido (0, negativo, fracionário, vazio)', () => {
    expect(validate('Maria', 'maria@exemplo.com', '0').qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '-5').qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '1.5').qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '   ').qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'abc').qtdAtletas).toBeDefined();
  });

  it('aceita o limite inferior (1 atleta)', () => {
    expect(validate('Maria', 'maria@exemplo.com', '1').qtdAtletas).toBeUndefined();
  });
});
