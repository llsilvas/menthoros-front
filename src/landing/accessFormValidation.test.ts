import { describe, it, expect } from 'vitest';
import { buildWaitlistPayload, resolveSuccessContent, validate, type AccessFormValues } from './accessFormValidation';
import { accessSuccess } from './content';

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

  it('exige número de atletas para proprietário, igual a treinador', () => {
    expect(validate('Maria', 'maria@exemplo.com', 'PROPRIETARIO', '', true).qtdAtletas).toBeDefined();
    expect(validate('Maria', 'maria@exemplo.com', 'PROPRIETARIO', '15', true).qtdAtletas).toBeUndefined();
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

function valores(overrides: Partial<AccessFormValues> = {}): AccessFormValues {
  return {
    nome: 'Maria',
    email: 'maria@exemplo.com',
    telefone: '',
    perfil: 'TREINADOR',
    qtdAtletasRaw: '15',
    watchBrand: '',
    aceiteLgpd: true,
    website: '',
    ...overrides,
  };
}

describe('buildWaitlistPayload', () => {
  it('monta o payload de treinador com qtdAtletas mapeado e sem watchBrand quando não selecionado', () => {
    expect(buildWaitlistPayload(valores(), {})).toEqual({
      nome: 'Maria',
      email: 'maria@exemplo.com',
      telefone: undefined,
      perfil: 'TREINADOR',
      qtdAtletas: 'DE_11_A_30',
      watchBrand: undefined,
      aceiteLgpd: true,
      website: undefined,
    });
  });

  it('inclui watchBrand quando selecionado para proprietário', () => {
    const payload = buildWaitlistPayload(valores({ perfil: 'PROPRIETARIO', watchBrand: 'COROS' }), {});
    expect(payload.perfil).toBe('PROPRIETARIO');
    expect(payload.watchBrand).toBe('COROS');
  });

  it('não envia qtdAtletas nem watchBrand para atleta, mesmo com watchBrand selecionado', () => {
    const payload = buildWaitlistPayload(valores({ perfil: 'ATLETA', watchBrand: 'GARMIN' }), {});
    expect(payload.qtdAtletas).toBeUndefined();
    expect(payload.watchBrand).toBeUndefined();
  });

  it('espalha os parâmetros UTM recebidos', () => {
    const payload = buildWaitlistPayload(valores(), { utmSource: 'instagram' });
    expect(payload.utmSource).toBe('instagram');
  });
});

describe('resolveSuccessContent', () => {
  it('usa o segmento do backend quando presente, mesmo que difira do perfil local', () => {
    expect(resolveSuccessContent('TREINADOR', 'OTHER_BRAND')).toBe(accessSuccess.outraMarca);
    expect(resolveSuccessContent('TREINADOR', 'QUALIFIED')).toBe(accessSuccess.treinador);
    expect(resolveSuccessContent('TREINADOR', 'ATLETA')).toBe(accessSuccess.atleta);
  });

  it('cai para o perfil local quando a resposta não traz segment', () => {
    expect(resolveSuccessContent('ATLETA', undefined)).toBe(accessSuccess.atleta);
    expect(resolveSuccessContent('TREINADOR', undefined)).toBe(accessSuccess.treinador);
    expect(resolveSuccessContent('PROPRIETARIO', undefined)).toBe(accessSuccess.treinador);
  });
});
