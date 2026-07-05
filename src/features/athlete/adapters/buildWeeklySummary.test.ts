import { describe, it, expect } from 'vitest';
import { buildWeeklySummary } from './buildWeeklySummary';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import type { AthleteMetricasChave, AthleteProximoTreino } from '../../../types/AthleteHome';

const HOJE = new Date('2026-07-04T12:00:00Z'); // sábado

function treino(dataTreino: string, distanciaKm?: number): TreinoRealizadoDto {
  return {
    id: dataTreino,
    dataTreino,
    tipoTreino: 'CONTINUO',
    duracaoMin: '00:30:00',
    distanciaKm,
    fonteDados: { value: 'MANUAL', label: 'Manual' },
    status: { value: 'CONCLUIDO', label: 'Concluído' },
  };
}

describe('buildWeeklySummary', () => {
  it('soma treinos e volume dos últimos 7 dias, com forma e próximo treino', () => {
    const treinos = [
      treino('2026-07-03', 10), // dentro dos 7 dias
      treino('2026-06-29', 15.5), // dentro dos 7 dias (5 dias atrás)
      treino('2026-06-20', 100), // fora da janela — não deve contar
    ];
    const metricas: AthleteMetricasChave = { statusForma: 'FORMA_IDEAL' };
    const proximo: AthleteProximoTreino = { tipoTreino: 'INTERVALADO' };

    const resumo = buildWeeklySummary(treinos, metricas, proximo, 4, HOJE);

    expect(resumo.totalTreinos).toBe(2);
    expect(resumo.volumeTotalKm).toBeCloseTo(25.5);
    expect(resumo.streak).toBe(4);
    expect(resumo.formaAtual).toBe('Forma ideal');
    expect(resumo.proximoTreino).toBe('INTERVALADO');
  });

  it('sem treinos na semana: 0 treinos, 0 km (não fabrica um resumo inválido)', () => {
    const resumo = buildWeeklySummary([], undefined, undefined, 0, HOJE);

    expect(resumo.totalTreinos).toBe(0);
    expect(resumo.volumeTotalKm).toBe(0);
    expect(resumo.streak).toBe(0);
  });

  it('ignora distanciaKm nulo/zero na soma do volume', () => {
    const treinos = [treino('2026-07-03', undefined), treino('2026-07-02', 5)];
    const resumo = buildWeeklySummary(treinos, undefined, undefined, 1, HOJE);

    expect(resumo.totalTreinos).toBe(2);
    expect(resumo.volumeTotalKm).toBe(5);
  });

  it('forma ausente vira "—", nunca fabrica um valor', () => {
    const resumo = buildWeeklySummary([], undefined, undefined, 0, HOJE);
    expect(resumo.formaAtual).toBe('—');
  });

  it('faixa de forma desconhecida (fora do mapa) também vira "—", sem quebrar', () => {
    const metricas = { statusForma: 'FAIXA_INEXISTENTE' } as unknown as AthleteMetricasChave;
    const resumo = buildWeeklySummary([], metricas, undefined, 0, HOJE);
    expect(resumo.formaAtual).toBe('—');
  });

  it('próximo treino ausente vira null, não fabrica', () => {
    const resumo = buildWeeklySummary([], undefined, undefined, 0, HOJE);
    expect(resumo.proximoTreino).toBeNull();
  });
});
