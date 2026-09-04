import { describe, it, expect, vi, afterEach } from 'vitest';
import { format } from 'date-fns';
import { selectAthletePlan } from './selectAthletePlan';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';

function plano(id: string, inicio: string, fim: string): PlanoSemanal {
  return {
    id,
    atletaId: 'a1',
    semanaInicio: inicio,
    semanaFim: fim,
    volumePlanejadoKm: 40,
    volumeRealizadoKm: 20,
    volumeAlvoKm: 45,
    status: 'ATIVO',
  };
}

describe('selectAthletePlan', () => {
  const hoje = '2026-07-03';
  afterEach(() => vi.useRealTimers());

  it('usa a data LOCAL como hoje (não UTC): o plano escolhido contém a data local do aparelho', () => {
    // 23:30 de domingo em UTC-3 já é segunda em UTC. Em qualquer fuso, o plano escolhido tem de
    // conter a data LOCAL — o código anterior usava toISOString() e, em UTC-3, escolhia p2.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-30T23:30:00-03:00'));
    const local = format(new Date(), 'yyyy-MM-dd');
    const corrente = plano('p1', '2026-08-24', '2026-08-30');
    const proxima = plano('p2', '2026-08-31', '2026-09-06');
    const escolhido = selectAthletePlan([corrente, proxima]);
    expect(escolhido).not.toBeNull();
    expect(escolhido!.semanaInicio <= local && local <= escolhido!.semanaFim).toBe(true);
  });

  it('retorna null para resposta vazia/nula', () => {
    expect(selectAthletePlan(null, hoje)).toBeNull();
    expect(selectAthletePlan(undefined, hoje)).toBeNull();
    expect(selectAthletePlan([], hoje)).toBeNull();
  });

  it('normaliza objeto único (contrato real do backend p/ ATLETA)', () => {
    const p = plano('p1', '2026-06-29', '2026-07-05');
    expect(selectAthletePlan(p, hoje)?.id).toBe('p1');
  });

  it('escolhe o plano cuja semana contém hoje quando vem lista', () => {
    const anterior = plano('p0', '2026-06-22', '2026-06-28');
    const atual = plano('p1', '2026-06-29', '2026-07-05');
    expect(selectAthletePlan([anterior, atual], hoje)?.id).toBe('p1');
  });

  it('cai no mais recente por semanaInicio quando nenhum contém hoje', () => {
    const p0 = plano('p0', '2026-05-01', '2026-05-07');
    const p1 = plano('p1', '2026-06-01', '2026-06-07');
    expect(selectAthletePlan([p0, p1], hoje)?.id).toBe('p1');
  });

  it('inclui bordas da semana (início e fim)', () => {
    const p = plano('p1', '2026-07-03', '2026-07-09');
    expect(selectAthletePlan(p, '2026-07-03')?.id).toBe('p1');
    expect(selectAthletePlan(p, '2026-07-09')?.id).toBe('p1');
  });
});
