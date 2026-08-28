import { describe, it, expect } from 'vitest';
import { validate } from './accessFormValidation';

describe('validate (AccessForm)', () => {
  it('não acusa erro para entrada válida', () => {
    expect(validate('Maria', 'maria@exemplo.com', '15', true)).toEqual({});
  });

  it('exige nome', () => {
    expect(validate('  ', 'maria@exemplo.com', '15', true).nome).toBeDefined();
  });

  it('exige email válido', () => {
    expect(validate('Maria', 'invalido', '15', true).email).toBeDefined();
    expect(validate('Maria', 'a@b', '15', true).email).toBeDefined();
  });

  it('rejeita número de atletas inválido (0, negativo, fracionário, vazio)', () => {
    expect(validate('Maria', 'maria@exemplo.com', '0', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '-5', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '1.5', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', '   ', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'abc', true).qtdAtletas).toBeDefined();
  });

  it('aceita o limite inferior (1 atleta)', () => {
    expect(validate('Maria', 'maria@exemplo.com', '1', true).qtdAtletas).toBeUndefined();
  });

  it('exige aceite da LGPD', () => {
    expect(validate('Maria', 'maria@exemplo.com', '15', false).aceiteLgpd).toBeDefined();
  });

  it('não acusa erro de LGPD quando aceito', () => {
    expect(validate('Maria', 'maria@exemplo.com', '15', true).aceiteLgpd).toBeUndefined();
  });
});
