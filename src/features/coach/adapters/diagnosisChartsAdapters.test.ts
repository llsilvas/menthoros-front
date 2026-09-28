import { describe, expect, it } from 'vitest';
import { addDays, format, parseISO } from 'date-fns';
import {
  adherenceTone,
  assessAcwrConfidence,
  buildAdherenceWindow,
  buildWeeklyDiagnosis,
  calculateLoadDelta7d,
  detectDataGaps,
  formatGapCaption,
  isFieldAvailable,
} from './diagnosisChartsAdapters';
import type { AderenciasSemanalDto, PmcPontoRaw } from '../../../types/AtletaPerfilCoach';

const d = (iso: string) => parseISO(iso);

/** Série diária densa de `inicio` a `fim`; `tssDe(dia)` decide o TSS de cada dia. */
function serie(inicio: string, fim: string, tssDe: (iso: string) => number): PmcPontoRaw[] {
  const pontos: PmcPontoRaw[] = [];
  for (let dia = d(inicio); dia <= d(fim); dia = addDays(dia, 1)) {
    const iso = format(dia, 'yyyy-MM-dd');
    pontos.push({ data: iso, ctl: 40, atl: 40, tsb: 0, tss: tssDe(iso) });
  }
  return pontos;
}

const dentro = (iso: string, de: string, ate: string) => iso >= de && iso <= ate;

describe('detectDataGaps', () => {
  it('marca a lacuna entre dois treinos (60 dias)', () => {
    const pmc = serie('2026-07-01', '2026-09-28', (iso) => (dentro(iso, '2026-07-16', '2026-09-13') ? 0 : 50));
    expect(detectDataGaps(pmc, d('2026-09-28'))).toEqual([
      { start: '2026-07-16', end: '2026-09-13', days: 60, open: false },
    ]);
  });

  it('funciona com série esparsa (dias omitidos)', () => {
    const pmc: PmcPontoRaw[] = [
      { data: '2026-07-15', ctl: 40, atl: 40, tsb: 0, tss: 50 },
      { data: '2026-09-14', ctl: 20, atl: 10, tsb: 10, tss: 40 },
    ];
    expect(detectDataGaps(pmc, d('2026-09-14'))[0]).toMatchObject({ start: '2026-07-16', end: '2026-09-13', days: 60 });
  });

  it('descanso de 9 dias não é lacuna', () => {
    const pmc = serie('2026-09-01', '2026-09-28', (iso) => (dentro(iso, '2026-09-10', '2026-09-18') ? 0 : 50));
    expect(detectDataGaps(pmc, d('2026-09-28'))).toEqual([]);
  });

  it('lacuna em aberto vai até hoje', () => {
    const pmc = serie('2026-09-01', '2026-09-28', (iso) => (iso <= '2026-09-16' ? 50 : 0));
    expect(detectDataGaps(pmc, d('2026-09-28'))).toEqual([
      { start: '2026-09-17', end: '2026-09-28', days: 12, open: true },
    ]);
  });

  it('início de histórico sem treino não é lacuna', () => {
    const pmc = serie('2026-08-01', '2026-09-28', (iso) => (iso >= '2026-09-01' ? 50 : 0));
    expect(detectDataGaps(pmc, d('2026-09-28'))).toEqual([]);
  });

  it('sem treino nenhum → sem lacunas', () => {
    expect(detectDataGaps([], d('2026-09-28'))).toEqual([]);
  });
});

describe('buildWeeklyDiagnosis', () => {
  const hoje = d('2026-09-28'); // segunda
  const pmc = serie('2026-06-01', '2026-09-28', (iso) => (dentro(iso, '2026-07-16', '2026-09-13') ? 0 : 10));
  const gaps = detectDataGaps(pmc, hoje);
  const aderencia: AderenciasSemanalDto[] = [
    { semanaInicio: '2026-09-21', totalPlanejado: 4, totalRealizado: 2, percentual: 50 },
    { semanaInicio: '2026-07-06', totalPlanejado: 4, totalRealizado: 4, percentual: 100 },
  ];
  const semanas = buildWeeklyDiagnosis(pmc, aderencia, gaps, hoje);

  it('8 semanas em ordem cronológica, a última é a atual — a cobertura de aderenciaSemanal no perfil', () => {
    expect(semanas).toHaveLength(8);
    expect(semanas[0].weekStart).toBe('2026-08-10');
    expect(semanas[7]).toMatchObject({ weekStart: '2026-09-28', label: '28/09', current: true });
  });

  it('semana inteira na lacuna não tem carga', () => {
    const agosto = semanas.find((s) => s.weekStart === '2026-08-10');
    expect(agosto).toMatchObject({ noData: true, tss: null, activeDays: null });
  });

  it('semana parcial na lacuna mantém a carga real', () => {
    const julho = buildWeeklyDiagnosis(pmc, aderencia, gaps, hoje, 12).find((s) => s.weekStart === '2026-07-13');
    expect(julho).toMatchObject({ noData: false, tss: 30, activeDays: 3 });
  });

  it('conta dias com treino, não treinos: o ponto PMC já é o agregado do dia', () => {
    // Dois treinos no mesmo dia chegam como um ponto só, com o TSS somado.
    const umDia: PmcPontoRaw[] = [{ data: '2026-09-22', ctl: 40, atl: 40, tsb: 0, tss: 120 }];
    const semana = buildWeeklyDiagnosis(umDia, [], [], hoje).find((s) => s.weekStart === '2026-09-21');
    expect(semana).toMatchObject({ tss: 120, activeDays: 1 });
  });

  it('lacuna aberta cobre a semana atual qualquer que seja o horário do acesso', () => {
    const pmcAberto = serie('2026-08-01', '2026-09-16', () => 30);
    const madrugada = new Date(2026, 8, 28, 0, 5);
    const tarde = new Date(2026, 8, 28, 15, 30);
    const deMadrugada = buildWeeklyDiagnosis(pmcAberto, [], detectDataGaps(pmcAberto, madrugada), madrugada);
    const deTarde = buildWeeklyDiagnosis(pmcAberto, [], detectDataGaps(pmcAberto, tarde), tarde);
    expect(deTarde).toEqual(deMadrugada);
    expect(deTarde[7]).toMatchObject({ weekStart: '2026-09-28', noData: true, tss: null });
  });

  it('cruza a adesão pela segunda-feira da semana', () => {
    expect(semanas.find((s) => s.weekStart === '2026-09-21')).toMatchObject({ adherence: 50, completed: 2, planned: 4 });
    expect(semanas.find((s) => s.weekStart === '2026-09-14')).toMatchObject({ adherence: null, planned: null });
  });

  it('sem PMC e sem aderência → vazio', () => {
    expect(buildWeeklyDiagnosis([], [], [], hoje)).toEqual([]);
  });
});

describe('buildAdherenceWindow', () => {
  const hoje = d('2026-09-28');
  const semanas: AderenciasSemanalDto[] = [
    { semanaInicio: '2026-08-24', totalPlanejado: 4, totalRealizado: 4, percentual: 100 }, // fora da janela
    { semanaInicio: '2026-09-07', totalPlanejado: 4, totalRealizado: 0, percentual: 0 },
    { semanaInicio: '2026-09-14', totalPlanejado: 4, totalRealizado: 1, percentual: 25 },
    { semanaInicio: '2026-09-21', totalPlanejado: 4, totalRealizado: 2, percentual: 50 },
    { semanaInicio: '2026-09-28', totalPlanejado: 4, totalRealizado: 2, percentual: 50 },
  ];

  it('soma realizado/planejado das 4 semanas civis', () => {
    expect(buildAdherenceWindow(semanas, hoje)).toEqual({ percent: 31, completed: 5, planned: 16, weeks: 4 });
  });

  it('plano já gerado para a próxima semana não entra na janela', () => {
    const cheias: AderenciasSemanalDto[] = [
      { semanaInicio: '2026-09-07', totalPlanejado: 4, totalRealizado: 4, percentual: 100 },
      { semanaInicio: '2026-09-14', totalPlanejado: 4, totalRealizado: 4, percentual: 100 },
      { semanaInicio: '2026-09-21', totalPlanejado: 4, totalRealizado: 4, percentual: 100 },
      { semanaInicio: '2026-09-28', totalPlanejado: 4, totalRealizado: 4, percentual: 100 },
      { semanaInicio: '2026-10-05', totalPlanejado: 4, totalRealizado: 0, percentual: 0 },
    ];
    expect(buildAdherenceWindow(cheias, hoje)).toEqual({ percent: 100, completed: 16, planned: 16, weeks: 4 });
  });

  it('janela não depende do horário do acesso', () => {
    expect(buildAdherenceWindow(semanas, new Date(2026, 8, 28, 23, 50))).toEqual(buildAdherenceWindow(semanas, hoje));
  });

  it('sem plano na janela → null', () => {
    expect(buildAdherenceWindow([semanas[0]], hoje)).toBeNull();
  });
});

describe('calculateLoadDelta7d', () => {
  const hoje = d('2026-09-28');

  it('compara TSS dos últimos 7 dias com os 7 anteriores', () => {
    const pmc = serie('2026-09-15', '2026-09-28', (iso) => (iso >= '2026-09-22' ? 15 : 10));
    expect(calculateLoadDelta7d(pmc, hoje)).toBe(50);
  });

  it('sem base anterior → null', () => {
    const pmc = serie('2026-09-15', '2026-09-28', (iso) => (iso >= '2026-09-22' ? 15 : 0));
    expect(calculateLoadDelta7d(pmc, hoje)).toBeNull();
  });
});

describe('assessAcwrConfidence', () => {
  const hoje = d('2026-09-28');

  it('histórico curto → BAIXA', () => {
    const pmc = serie('2026-09-10', '2026-09-28', () => 50);
    expect(assessAcwrConfidence(pmc, [], hoje).level).toBe('BAIXA');
  });

  it('lacuna tocando os últimos 28 dias → BAIXA com motivo', () => {
    const pmc = serie('2026-06-01', '2026-09-28', (iso) => (dentro(iso, '2026-07-16', '2026-09-13') ? 0 : 50));
    const r = assessAcwrConfidence(pmc, detectDataGaps(pmc, hoje), hoje);
    expect(r).toEqual({ level: 'BAIXA', reason: 'Base crônica incompleta: 60 dias sem treinos registrados' });
  });

  it('série densa que começa com zeros: a pausa ficou fora do recorte, então a base não existe → BAIXA', () => {
    // 87 dias com TSS 0 e 3 dias de retorno: o último treino antes da pausa não veio no payload.
    const pmc = serie('2026-07-01', '2026-09-28', (iso) => (iso >= '2026-09-26' ? 60 : 0));
    const r = assessAcwrConfidence(pmc, detectDataGaps(pmc, hoje), hoje);
    expect(r.level).toBe('BAIXA');
  });

  it('série esparsa com o mesmo retorno → BAIXA', () => {
    const pmc = serie('2026-09-26', '2026-09-28', () => 60);
    expect(assessAcwrConfidence(pmc, detectDataGaps(pmc, hoje), hoje).level).toBe('BAIXA');
  });

  it('base completa → ALTA', () => {
    const pmc = serie('2026-06-01', '2026-09-28', () => 50);
    expect(assessAcwrConfidence(pmc, [], hoje)).toEqual({ level: 'ALTA', reason: null });
  });
});

describe('adherenceTone', () => {
  it('usa os limiares do tile', () => {
    expect(adherenceTone(85)).toBe('success');
    expect(adherenceTone(70)).toBe('neutral');
    expect(adherenceTone(69)).toBe('warning');
  });
});

describe('formatGapCaption', () => {
  it('lacuna fechada e aberta', () => {
    expect(formatGapCaption({ start: '2026-07-16', end: '2026-09-13', days: 60, open: false }))
      .toBe('Sem treinos registrados de 16/07 a 13/09 (60 dias)');
    expect(formatGapCaption({ start: '2026-09-17', end: '2026-09-28', days: 12, open: true }))
      .toBe('Sem treinos registrados desde 17/09 (12 dias)');
  });
});

describe('isFieldAvailable', () => {
  it('campo listado em avisos é indisponível (a consulta falhou no backend)', () => {
    expect(isFieldAvailable(['aderenciaSemanal'], 'aderenciaSemanal')).toBe(false);
    expect(isFieldAvailable(['aderenciaSemanal'], 'pmc')).toBe(true);
  });

  it('sem avisos → disponível', () => {
    expect(isFieldAvailable(null, 'pmc')).toBe(true);
    expect(isFieldAvailable(undefined, 'pmc')).toBe(true);
  });
});
