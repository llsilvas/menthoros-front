import { describe, expect, it } from 'vitest';
import { selectTodayState } from './selectTodayState';
import type { AthleteHome } from '../../../types/AthleteHome';

const HOJE = '2026-08-27';

describe('selectTodayState', () => {
  it('PLANEJADO: treino de hoje, sem realizado', () => {
    const home: AthleteHome = { hoje: HOJE, proximoTreino: { data: HOJE, statusTreino: 'PENDENTE' } };
    expect(selectTodayState(home)).toBe('PLANEJADO');
  });

  it('FEITO_SEM_FEEDBACK: realizado hoje sem carimbo (nunca respondeu)', () => {
    const home: AthleteHome = { hoje: HOJE, realizadoHoje: { id: 'r1' } };
    expect(selectTodayState(home)).toBe('FEITO_SEM_FEEDBACK');
  });

  it('FEITO_SEM_FEEDBACK: RPE legado sem carimbo continua incompleto (D3, não "afirmar" completo por ter número)', () => {
    const home: AthleteHome = { hoje: HOJE, realizadoHoje: { id: 'r1', percepcaoEsforco: 6 } };
    expect(selectTodayState(home)).toBe('FEITO_SEM_FEEDBACK');
  });

  it('FEITO: realizado hoje com feedbackRegistradoEm', () => {
    const home: AthleteHome = { hoje: HOJE, realizadoHoje: { id: 'r1', feedbackRegistradoEm: '2026-08-27T19:00:00' } };
    expect(selectTodayState(home)).toBe('FEITO');
  });

  it('PULADO: planejado de hoje PERDIDO', () => {
    const home: AthleteHome = { hoje: HOJE, proximoTreino: { data: HOJE, statusTreino: 'PERDIDO', motivoPulo: 'DOR' } };
    expect(selectTodayState(home)).toBe('PULADO');
  });

  it('DESCANSO: sem treino planejado hoje e sem realizado', () => {
    const home: AthleteHome = { hoje: HOJE };
    expect(selectTodayState(home)).toBe('DESCANSO');
  });

  it('DESCANSO: proximoTreino existe mas é de outro dia (janela de 14 dias do backend)', () => {
    const home: AthleteHome = { hoje: HOJE, proximoTreino: { data: '2026-08-29', statusTreino: 'PENDENTE' } };
    expect(selectTodayState(home)).toBe('DESCANSO');
  });

  it('realizado hoje vence o planejado de hoje (feito é o eixo primário do dia)', () => {
    const home: AthleteHome = {
      hoje: HOJE,
      proximoTreino: { data: HOJE, statusTreino: 'PENDENTE' },
      realizadoHoje: { id: 'r1', feedbackRegistradoEm: '2026-08-27T19:00:00' },
    };
    expect(selectTodayState(home)).toBe('FEITO');
  });

  it('sem hoje (home ainda não carregado): DESCANSO como default seguro, sem inventar treino', () => {
    expect(selectTodayState(null)).toBe('DESCANSO');
    expect(selectTodayState({})).toBe('DESCANSO');
  });
});
