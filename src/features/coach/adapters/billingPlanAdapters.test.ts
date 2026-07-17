import { describe, it, expect } from 'vitest';
import { resolveStatusVencimentoPlanoBadge } from './billingPlanAdapters';

describe('resolveStatusVencimentoPlanoBadge', () => {
  it('retorna null quando status é ausente', () => {
    expect(resolveStatusVencimentoPlanoBadge(undefined)).toBeNull();
  });

  it('mapeia VENCIDO para variant danger', () => {
    expect(resolveStatusVencimentoPlanoBadge('VENCIDO')).toEqual({ variant: 'danger', label: 'Vencido' });
  });

  it('mapeia PROXIMO_VENCIMENTO para variant warning', () => {
    expect(resolveStatusVencimentoPlanoBadge('PROXIMO_VENCIMENTO'))
      .toEqual({ variant: 'warning', label: 'Vence em breve' });
  });

  it('mapeia EM_DIA para variant active', () => {
    expect(resolveStatusVencimentoPlanoBadge('EM_DIA')).toEqual({ variant: 'active', label: 'Em dia' });
  });
});
