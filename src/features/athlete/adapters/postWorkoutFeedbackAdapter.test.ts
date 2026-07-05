import { describe, it, expect } from 'vitest';
import { buildPostWorkoutFeedback } from './postWorkoutFeedbackAdapter';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

function treino(overrides: Partial<TreinoRealizadoDto> = {}): TreinoRealizadoDto {
  return {
    id: 't1',
    dataTreino: '2026-07-04',
    tipoTreino: 'CONTINUO',
    duracaoMin: '01:00:00',
    distanciaKm: 10,
    percepcaoEsforco: 6,
    tssCalculado: 62,
    fonteDados: { value: 'MANUAL', label: 'Manual' },
    status: { value: 'CONCLUIDO', label: 'Concluído' },
    ...overrides,
  };
}

describe('buildPostWorkoutFeedback', () => {
  it('monta o card completo com emoji, duração, distância e TSS', () => {
    const feedback = buildPostWorkoutFeedback(treino());

    expect(feedback.tipoLabel).toBe('🏃 Corrida contínua');
    expect(feedback.duracaoLabel).toBe('60 min');
    expect(feedback.distanciaLabel).toBe('10.0 km');
    expect(feedback.tssLabel).toBe('TSS 62');
    expect(feedback.mensagem).toBe('Bom treino! Mantenha a consistência.');
  });

  it('RPE alto (>=8) usa mensagem de recuperação', () => {
    expect(buildPostWorkoutFeedback(treino({ percepcaoEsforco: 8 })).mensagem)
      .toBe('Grande esforço! Respeite a recuperação.');
    expect(buildPostWorkoutFeedback(treino({ percepcaoEsforco: 9 })).mensagem)
      .toBe('Grande esforço! Respeite a recuperação.');
  });

  it('RPE baixo (<=4) usa mensagem de ativação', () => {
    expect(buildPostWorkoutFeedback(treino({ percepcaoEsforco: 4 })).mensagem)
      .toBe('Bom treino leve! Ativação no ponto.');
    expect(buildPostWorkoutFeedback(treino({ percepcaoEsforco: 1 })).mensagem)
      .toBe('Bom treino leve! Ativação no ponto.');
  });

  it('RPE ausente (nulo) usa a mensagem default, sem fabricar um RPE', () => {
    expect(buildPostWorkoutFeedback(treino({ percepcaoEsforco: undefined })).mensagem)
      .toBe('Bom treino! Mantenha a consistência.');
  });

  it('omite a distância quando nula ou zero (ex.: musculação)', () => {
    expect(buildPostWorkoutFeedback(treino({ distanciaKm: undefined })).distanciaLabel).toBeNull();
    expect(buildPostWorkoutFeedback(treino({ distanciaKm: 0 })).distanciaLabel).toBeNull();
  });

  it('omite o TSS quando nulo', () => {
    expect(buildPostWorkoutFeedback(treino({ tssCalculado: undefined })).tssLabel).toBeNull();
  });

  it('tipo desconhecido usa o label sem emoji, nunca quebra', () => {
    const feedback = buildPostWorkoutFeedback(treino({ tipoTreino: 'INEXISTENTE' as TreinoRealizadoDto['tipoTreino'] }));
    expect(feedback.tipoLabel).toBe('INEXISTENTE');
  });

  it('duração malformada não quebra — omite a linha', () => {
    expect(buildPostWorkoutFeedback(treino({ duracaoMin: 'abc' })).duracaoLabel).toBeNull();
  });
});
