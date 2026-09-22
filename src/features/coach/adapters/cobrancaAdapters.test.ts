import { describe, it, expect } from 'vitest';
import { resolveStatusCobrancaBadge, formatProximoVencimento } from './cobrancaAdapters';

describe('resolveStatusCobrancaBadge', () => {
  it('retorna null quando status é ausente', () => {
    expect(resolveStatusCobrancaBadge(undefined)).toBeNull();
  });

  it('mapeia OVERDUE para variant danger', () => {
    expect(resolveStatusCobrancaBadge('OVERDUE')).toEqual({ variant: 'danger', label: 'Vencido' });
  });

  it('mapeia DUE_SOON para variant warning', () => {
    expect(resolveStatusCobrancaBadge('DUE_SOON'))
      .toEqual({ variant: 'warning', label: 'Vence em breve' });
  });

  it('mapeia UP_TO_DATE para variant active', () => {
    expect(resolveStatusCobrancaBadge('UP_TO_DATE')).toEqual({ variant: 'active', label: 'Em dia' });
  });
});

describe('formatProximoVencimento', () => {
  it('retorna string vazia quando ausente', () => {
    expect(formatProximoVencimento(undefined)).toBe('');
  });

  it('formata yyyy-MM-dd para dd/MM/yyyy', () => {
    expect(formatProximoVencimento('2026-10-10')).toBe('10/10/2026');
  });
});
