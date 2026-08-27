import { describe, expect, it } from 'vitest';
import { buildStrongerReading, buildZonesReading, buildAdherenceReading, buildRecordsReading } from './buildProgressReadings';
import type { PmcPontoRaw } from '../../../types/AtletaPerfilCoach';

const HOJE = new Date(2026, 7, 26);
const ponto = (data: string, ctl: number, statusForma?: PmcPontoRaw['statusForma']): PmcPontoRaw => ({ data, ctl, atl: ctl - 5, tsb: 5, tss: 40, statusForma });

describe('buildStrongerReading', () => {
  it('sobe: delta positivo acima do limiar, com a forma em palavras do backend', () => {
    const r = buildStrongerReading([ponto('2026-07-29', 42), ponto('2026-08-26', 48, 'FORMA_IDEAL')], HOJE)!;
    expect(r.delta).toBe(6);
    expect(r.tendencia).toBe('subiu');
    expect(r.ctlHoje).toBe(48);
    expect(r.forma?.label).toBe('Forma ideal');
  });

  it('estável quando |Δ| < 3; caiu quando ≤ −3', () => {
    expect(buildStrongerReading([ponto('2026-07-29', 48), ponto('2026-08-26', 46)], HOJE)!.tendencia).toBe('estavel');
    expect(buildStrongerReading([ponto('2026-07-29', 48), ponto('2026-08-26', 44)], HOJE)!.tendencia).toBe('caiu');
  });

  it('ponto de D−28 ausente: usa o mais próximo dentro de ±3 dias', () => {
    const r = buildStrongerReading([ponto('2026-07-31', 40), ponto('2026-08-26', 48)], HOJE)!; // D−26
    expect(r.delta).toBe(8);
  });

  it('sem ponto na janela: "ainda cedo" (delta e tendência nulos), mas mantém CTL de hoje e sparkline', () => {
    const r = buildStrongerReading([ponto('2026-08-10', 45), ponto('2026-08-26', 48)], HOJE)!;
    expect(r.delta).toBeNull();
    expect(r.tendencia).toBeNull();
    expect(r.ctlHoje).toBe(48);
    expect(r.sparkline).toEqual([45, 48]);
  });

  it('PMC vazio → null; sparkline só com os últimos 84 dias, ordenada', () => {
    expect(buildStrongerReading([], HOJE)).toBeNull();
    const r = buildStrongerReading([ponto('2026-08-26', 48), ponto('2026-05-01', 30), ponto('2026-07-29', 42)], HOJE)!;
    expect(r.sparkline).toEqual([42, 48]);
  });

  it('nunca produz texto de veredito: só números e tendência', () => {
    const r = buildStrongerReading([ponto('2026-07-29', 42), ponto('2026-08-26', 48)], HOJE)!;
    expect(JSON.stringify(r)).not.toMatch(/\b(Sim|Não|bem|mal)\b/);
  });
});

describe('buildZonesReading', () => {
  it('percentuais somam 100 (resto na maior zona) e a dominante é a maior', () => {
    const r = buildZonesReading({ z1: 1000, z2: 1000, z3: 1000, z4: 0, z5: 0, duracaoTotalSegundos: 3000 })!; // 33+33+33 = 99
    expect(r.percentuais.z1 + r.percentuais.z2 + r.percentuais.z3 + r.percentuais.z4 + r.percentuais.z5).toBe(100);
    expect(r.percentuais.z1).toBe(34);
    const r2 = buildZonesReading({ z1: 12, z2: 62, z3: 10, z4: 13, z5: 3, duracaoTotalSegundos: 100 })!;
    expect(r2.dominante).toBe('z2');
  });

  it('sem dados → null', () => {
    expect(buildZonesReading(null)).toBeNull();
    expect(buildZonesReading({ z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, duracaoTotalSegundos: 0 })).toBeNull();
  });
});

describe('buildAdherenceReading', () => {
  it('sempre 4 semanas, corrente marcada, semanas ausentes como "sem plano"; N de M e percentual', () => {
    const r = buildAdherenceReading([
      { semanaInicio: '2026-08-10', totalPlanejado: 4, totalRealizado: 3, percentual: 75 },
      { semanaInicio: '2026-08-24', totalPlanejado: 3, totalRealizado: 2, percentual: 67 },
    ], HOJE)!;
    expect(r.semanas.map((s) => s.semanaInicio)).toEqual(['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24']);
    expect(r.semanas.map((s) => s.semPlano)).toEqual([true, false, true, false]);
    expect(r.semanas[3].corrente).toBe(true);
    expect(r.realizado).toBe(5);
    expect(r.planejado).toBe(7);
    expect(r.percentual).toBe(71);
  });

  it('lista vazia → null (sem dados, não 0 de 0)', () => {
    expect(buildAdherenceReading([], HOJE)).toBeNull();
  });
});

describe('buildRecordsReading', () => {
  it('marca "novo" nos últimos 28 dias, preserva ISO e formata a data', () => {
    const r = buildRecordsReading([
      { distancia: '5 km', tempoSegundos: 1471, data: '2026-08-10', treinoRealizadoId: 't1' },
      { distancia: '10 km', tempoSegundos: 3128, data: '2026-05-03', treinoRealizadoId: 't2' },
    ], [], HOJE);
    expect(r.rows[0].novo).toBe(true);
    expect(r.rows[1].novo).toBe(false);
    expect(r.rows[0].dataIso).toBe('2026-08-10');
    expect(r.rows[0].dataFormatada).toMatch(/10 de ago/);
    expect(r.proximaProva).toBeNull();
  });
});
