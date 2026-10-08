import { describe, it, expect } from 'vitest';
import { validate } from './accessFormValidation';

describe('validate (AccessRequestForm)', () => {
  it('não acusa erro para entrada válida de treinador', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '15', true)).toEqual({});
  });

  it('não acusa erro para entrada válida de atleta (sem exigir número de atletas)', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'ATLETA', '', true)).toEqual({});
  });

  it('exige nome', () => {
    expect(validate('  ', 'maria@exemplo.com', 'TREINADOR', '15', true).nome).toBeDefined();
  });

  it('exige email válido', () => {
    expect(validate('Maria', 'invalido', 'TREINADOR', '15', true).email).toBeDefined();
    expect(validate('Maria', 'a@b', 'TREINADOR', '15', true).email).toBeDefined();
  });

  it('exige perfil selecionado', () => {
    expect(validate('Maria', 'maria@exemplo.com', '', '15', true).perfil).toBeDefined();
  });

  it('rejeita número de atletas inválido para treinador (0, negativo, fracionário, vazio)', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '0', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '-5', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '1.5', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '   ', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', 'abc', true).qtdAtletas).toBeDefined();
  });

  it('aceita o limite inferior (1 atleta) para treinador', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '1', true).qtdAtletas).toBeUndefined();
  });

  it('não exige número de atletas quando o perfil é atleta, mesmo vazio ou inválido', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'ATLETA', '', true).qtdAtletas).toBeUndefined();
    expect(validate('Maria', 'maria@exemplo.com', 'ATLETA', 'abc', true).qtdAtletas).toBeUndefined();
  });

  it('exige aceite da LGPD', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '15', false).aceiteLgpd).toBeDefined();
  });

  it('não acusa erro de LGPD quando aceito', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'TREINADOR', '15', true).aceiteLgpd).toBeUndefined();
  });
});
