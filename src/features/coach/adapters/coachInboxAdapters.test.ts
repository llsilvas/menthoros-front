import { describe, expect, it } from 'vitest';
import { format, subDays } from 'date-fns';
import { buildInboxQueue, buildRosterRowFromSummary, buildSelectedAthleteFromDashboard, calcularMonotonia, calcularLoadDelta, calcularAcwr, getAcwrZone, getMonotonyTone, calcularStrain, contarDiasComTreino7d, getStrainZone, calcularPrevisaoForma, calcularDiasAteProva } from './coachInboxAdapters';
import type { PmcPontoRaw, AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';
import type { Prova } from '../../../types/Prova';
import { formatWorkoutTypeLabel } from '../components/coachInboxHelpers';
import type { CoachAtletaResumo, CoachAttentionItem, CoachDashboardRosterPage } from '../../../types/Coach';

function pmc(over: Partial<PmcPontoRaw>): PmcPontoRaw {
  return { data: '2026-06-01', ctl: 50, atl: 55, tsb: -5, tss: 80, ...over };
}

function profileComProvas(datas: string[]): AtletaPerfilCoachDto {
  return {
    provas: datas.map((d, i) => ({ nomeProva: `Prova ${i}`, dataProva: d } as Prova)),
  } as AtletaPerfilCoachDto;
}

const AGORA = new Date('2026-09-28T15:30:00');
/** Ponto PMC `n` dias antes de AGORA. */
const dia = (n: number, tss: number) => pmc({ data: format(subDays(AGORA, n), 'yyyy-MM-dd'), tss });

describe('calcularMonotonia', () => {
  it('null com menos de 3 dias com treino — sem número inventado', () => {
    expect(calcularMonotonia([], AGORA)).toBeNull();
    expect(calcularMonotonia([dia(1, 80), dia(0, 90)], AGORA)).toBeNull();
  });

  it('retorna 1.0 quando stddev é zero (treinos idênticos)', () => {
    const pts = Array.from({ length: 7 }, (_, i) => dia(6 - i, 70));
    expect(calcularMonotonia(pts, AGORA)).toBe(1.0);
  });

  it('calcula mean/stddev para série variada (BVA: exatamente 3 dias)', () => {
    const result = calcularMonotonia([dia(2, 70), dia(1, 80), dia(0, 90)], AGORA);
    expect(result).toBeGreaterThan(1.0);
    expect(result).toBeLessThan(15.0);
  });

  it('usa os 7 dias civis até hoje, não as 7 últimas posições do array', () => {
    const pts = [dia(9, 200), dia(8, 200), dia(7, 200), ...Array.from({ length: 7 }, (_, i) => dia(6 - i, 70))];
    expect(calcularMonotonia(pts, AGORA)).toBe(1.0);
  });

  it('série que parou há 12 dias não tem base na janela', () => {
    const pts = Array.from({ length: 7 }, (_, i) => dia(18 - i, 60 + i * 10));
    expect(calcularMonotonia(pts, AGORA)).toBeNull();
  });

  it('ignora dias com tss zero ou ausente', () => {
    expect(calcularMonotonia([dia(3, 0), dia(2, 0), dia(1, 80), dia(0, 90)], AGORA)).toBeNull();
  });
});

describe('contarDiasComTreino7d', () => {
  it('conta dias com TSS > 0 nos 7 dias civis até hoje', () => {
    expect(contarDiasComTreino7d([dia(8, 50), dia(6, 50), dia(3, 0), dia(1, 40), dia(0, 30)], AGORA)).toBe(3);
  });
});

describe('calcularLoadDelta', () => {
  it('retorna 0 com menos de 8 pontos (histórico insuficiente)', () => {
    const pts = Array.from({ length: 7 }, (_, i) => pmc({ ctl: 50 + i }));
    expect(calcularLoadDelta(pts)).toBe(0);
  });

  it('retorna 0 quando CTL da semana passada é zero (evita divisão por zero)', () => {
    const pts = Array.from({ length: 8 }, () => pmc({ ctl: 0 }));
    expect(calcularLoadDelta(pts)).toBe(0);
  });

  it('calcula delta positivo corretamente (BVA: exatamente 8 pontos)', () => {
    const pts = [pmc({ ctl: 50 }), ...Array.from({ length: 6 }, () => pmc({ ctl: 52 })), pmc({ ctl: 55 })];
    expect(calcularLoadDelta(pts)).toBe(10.0);
  });

  it('calcula delta negativo (carga em queda)', () => {
    const pts = [pmc({ ctl: 60 }), ...Array.from({ length: 6 }, () => pmc({ ctl: 58 })), pmc({ ctl: 54 })];
    expect(calcularLoadDelta(pts)).toBe(-10.0);
  });
});

describe('calcularAcwr', () => {
  it('retorna null quando atl ou ctl é null', () => {
    expect(calcularAcwr(null, 50)).toBeNull();
    expect(calcularAcwr(55, null)).toBeNull();
    expect(calcularAcwr(null, null)).toBeNull();
  });

  it('retorna null quando ctl é zero (evita divisão por zero)', () => {
    expect(calcularAcwr(55, 0)).toBeNull();
  });

  it('sweet spot: ATL = CTL → ACWR = 1.0', () => {
    expect(calcularAcwr(50, 50)).toBe(1.0);
  });

  it('zona ideal: ATL < CTL → ACWR < 1 (atleta descansando)', () => {
    expect(calcularAcwr(40, 50)).toBe(0.8);
  });

  it('zona de risco: ATL muito maior que CTL → ACWR > 1.5', () => {
    expect(calcularAcwr(90, 50)).toBe(1.8);
  });

  it('BVA: limiar exato 1.5 (fronteira atenção/risco)', () => {
    expect(calcularAcwr(75, 50)).toBe(1.5);
  });

  it('BVA: limiar exato 1.3 (fronteira ideal/atenção)', () => {
    expect(calcularAcwr(65, 50)).toBe(1.3);
  });
});

describe('getAcwrZone', () => {
  it('null → neutral / Sem dados', () => {
    expect(getAcwrZone(null)).toEqual({ tone: 'neutral', label: 'Sem dados' });
  });

  it('> 1.5 → danger / Risco', () => {
    expect(getAcwrZone(1.8)).toEqual({ tone: 'danger', label: 'Risco' });
  });

  it('BVA: 1.5 ainda é Atenção (limiar é > 1.5)', () => {
    expect(getAcwrZone(1.5)).toEqual({ tone: 'warning', label: 'Atenção' });
    expect(getAcwrZone(1.51)).toEqual({ tone: 'danger', label: 'Risco' });
  });

  it('1.3 < acwr <= 1.5 → warning / Atenção', () => {
    expect(getAcwrZone(1.4)).toEqual({ tone: 'warning', label: 'Atenção' });
  });

  it('BVA: 1.3 é Ideal (limiar é > 1.3)', () => {
    expect(getAcwrZone(1.3)).toEqual({ tone: 'success', label: 'Ideal' });
  });

  it('0.8 <= acwr <= 1.3 → success / Ideal', () => {
    expect(getAcwrZone(1.0)).toEqual({ tone: 'success', label: 'Ideal' });
    expect(getAcwrZone(0.8)).toEqual({ tone: 'success', label: 'Ideal' });
  });

  it('< 0.8 → warning / Muito baixo', () => {
    expect(getAcwrZone(0.5)).toEqual({ tone: 'warning', label: 'Muito baixo' });
  });
});

describe('getMonotonyTone', () => {
  it('BVA: 1.4 ainda é success (limiar é > 1.4)', () => {
    expect(getMonotonyTone(1.4)).toBe('success');
    expect(getMonotonyTone(1.5)).toBe('warning');
  });
});

describe('calcularStrain', () => {
  it('null com menos de 3 dias com treino na janela', () => {
    expect(calcularStrain([], AGORA)).toBeNull();
    expect(calcularStrain([dia(1, 80), dia(0, 90)], AGORA)).toBeNull();
    expect(calcularStrain(Array.from({ length: 7 }, (_, i) => dia(6 - i, 0)), AGORA)).toBeNull();
  });

  it('strain = TSS semanal × monotonia para treinos idênticos (monotonia=1.0)', () => {
    // 7 × 70 = 490, monotonia 1.0 → 490
    expect(calcularStrain(Array.from({ length: 7 }, (_, i) => dia(6 - i, 70)), AGORA)).toBe(490);
  });

  it('soma só os 7 dias civis, não treinos anteriores à janela', () => {
    const pts = [dia(10, 500), ...Array.from({ length: 7 }, (_, i) => dia(6 - i, 70))];
    expect(calcularStrain(pts, AGORA)).toBe(490);
  });

  it('strain supera o TSS semanal quando há variabilidade (monotonia > 1)', () => {
    const tss = [30, 30, 150, 30, 150, 30, 150];
    const pts = tss.map((t, i) => dia(6 - i, t));
    expect(calcularStrain(pts, AGORA)).toBeGreaterThan(570);
  });
});

describe('calcularPrevisaoForma', () => {
  it('retorna null quando ctl ou atl é null', () => {
    expect(calcularPrevisaoForma(null, 65, 14)).toBeNull();
    expect(calcularPrevisaoForma(50, null, 14)).toBeNull();
  });

  it('retorna null quando diasAteProva <= 0', () => {
    expect(calcularPrevisaoForma(50, 65, 0)).toBeNull();
    expect(calcularPrevisaoForma(50, 65, -3)).toBeNull();
  });

  it('taper de 14 dias: CTL cai menos que ATL → TSB positivo', () => {
    // CTL(14)=50·e^(-1/3)≈35.8 · ATL(14)=65·e^(-2)≈8.8 → TSB≈+27
    const r = calcularPrevisaoForma(50, 65, 14);
    expect(r).not.toBeNull();
    expect(r!.tsbPrevisto).toBeGreaterThan(20);
    expect(r!.tsbPrevisto).toBeLessThan(35);
  });

  it('atleta muito fatigado em taper longo (21d) → forma excelente', () => {
    const r = calcularPrevisaoForma(50, 90, 21);
    expect(r!.formaPrevista).toBe('form_excellent');
  });

  it('ctl=atl: ATL decai mais rápido que CTL → TSB levemente positivo', () => {
    const r = calcularPrevisaoForma(5, 5, 14);
    expect(r!.tsbPrevisto).toBeGreaterThan(0);
    expect(r!.tsbPrevisto).toBeLessThan(5);
  });
});

describe('calcularDiasAteProva', () => {
  const hoje = new Date('2026-06-26T12:00:00');

  it('retorna -1 sem prova cadastrada', () => {
    expect(calcularDiasAteProva({} as AtletaPerfilCoachDto, hoje)).toBe(-1);
    expect(calcularDiasAteProva(null, hoje)).toBe(-1);
  });

  it('calcula dias para prova futura usando a mais próxima', () => {
    expect(calcularDiasAteProva(profileComProvas(['2026-07-10', '2026-08-01']), hoje)).toBe(14);
  });

  it('retorna valor <= 0 quando a prova já passou', () => {
    expect(calcularDiasAteProva(profileComProvas(['2026-06-20']), hoje)).toBeLessThanOrEqual(0);
  });
  /** Dia civil, não horas: antes era ceil(meio-dia da prova − agora), que de manhã somava um dia. */
  it('independe do horário do acesso', () => {
    const provas = profileComProvas(['2026-07-10']);
    expect(calcularDiasAteProva(provas, new Date('2026-06-26T00:05:00'))).toBe(14);
    expect(calcularDiasAteProva(provas, new Date('2026-06-26T23:55:00'))).toBe(14);
  });

  it('prova hoje é 0 a qualquer hora', () => {
    expect(calcularDiasAteProva(profileComProvas(['2026-06-26']), new Date('2026-06-26T08:00:00'))).toBe(0);
  });
});

describe('getStrainZone', () => {
  it('null → neutral / Sem dados', () => {
    expect(getStrainZone(null)).toEqual({ tone: 'neutral', label: 'Sem dados' });
  });

  it('< 150 → neutral / Baixo', () => {
    expect(getStrainZone(100)).toEqual({ tone: 'neutral', label: 'Baixo' });
  });

  it('BVA: 150 → success / Moderado', () => {
    expect(getStrainZone(149)).toEqual({ tone: 'neutral', label: 'Baixo' });
    expect(getStrainZone(150)).toEqual({ tone: 'success', label: 'Moderado' });
  });

  it('BVA: 300 → warning / Alto', () => {
    expect(getStrainZone(299)).toEqual({ tone: 'success', label: 'Moderado' });
    expect(getStrainZone(300)).toEqual({ tone: 'warning', label: 'Alto' });
  });

  it('BVA: 600 → danger / Crítico', () => {
    expect(getStrainZone(599)).toEqual({ tone: 'warning', label: 'Alto' });
    expect(getStrainZone(600)).toEqual({ tone: 'danger', label: 'Crítico' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildInboxQueue — gate da change refine-inbox-visual-hierarchy (task 1.1)
// ─────────────────────────────────────────────────────────────────────────────

function atletaResumo(over: Partial<CoachAtletaResumo> & { atletaId: string; nome: string }): CoachAtletaResumo {
  return { status: 'active', weeklyVolume: 30, hasPendingSuggestion: false, ...over };
}

function pagina(items: CoachAtletaResumo[], over: Partial<CoachDashboardRosterPage> = {}): CoachDashboardRosterPage {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: 1, ...over };
}

function alerta(over: Partial<CoachAttentionItem> & { atletaId: string; athleteName: string }): CoachAttentionItem {
  return {
    severity: 'ALTA',
    priorityScore: 50,
    primaryReason: 'INATIVIDADE',
    suggestedAction: 'Entrar em contato',
    generatedAt: '2026-08-10T12:00:00Z',
    evidence: [],
    ...over,
  };
}

const SEM_FILTRO = { status: 'all' as const, search: '' };
const HOJE = new Date('2026-08-16T12:00:00Z');

describe('buildInboxQueue', () => {
  /**
   * O motivo do gate. A lista principal do inbox é o roster **paginado em 10**; a fila de atenção
   * não é paginada. Sem fixar, um atleta em alerta que caia na página 2 some da tela — e mostrar
   * quem precisa de atenção é justamente o job do inbox.
   */
  it('atleta em atenção fora do roster aparece fixado, mesmo na página 2', () => {
    const roster = pagina([atletaResumo({ atletaId: 'r1', nome: 'Bruno' })], { page: 1, totalElements: 25, totalPages: 3 });

    const { rows, pinnedCount } = buildInboxQueue(roster, [alerta({ atletaId: 'a1', athleteName: 'Ana' })], SEM_FILTRO, HOJE);

    expect(pinnedCount).toBe(1);
    expect(rows[0]).toMatchObject({ source: 'attention-only', atletaId: 'a1', athleteName: 'Ana' });
    expect(rows.map((r) => r.atletaId)).toEqual(['a1', 'r1']);
  });

  /**
   * `CoachAttentionItem` não tem as métricas que a linha de roster renderiza (aderência, volume,
   * forma). Se as duas fontes virassem o mesmo tipo, a linha fixada exibiria zeros com cara de
   * medição real — pior que não exibir.
   */
  it('linha attention-only não finge ter métricas de roster', () => {
    const { rows } = buildInboxQueue(pagina([]), [alerta({ atletaId: 'a1', athleteName: 'Ana' })], SEM_FILTRO, HOJE);

    expect(rows[0].source).toBe('attention-only');
    expect(rows[0]).not.toHaveProperty('row');
  });

  it('atleta nas duas fontes aparece uma vez, com o motivo da fila de atenção', () => {
    const roster = pagina([
      atletaResumo({ atletaId: 'a1', nome: 'Ana' }),
      atletaResumo({ atletaId: 'r1', nome: 'Bruno' }),
    ]);

    const { rows, pinnedCount } = buildInboxQueue(roster, [alerta({ atletaId: 'a1', athleteName: 'Ana' })], SEM_FILTRO, HOJE);

    expect(rows.filter((r) => r.atletaId === 'a1')).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: 'roster', atletaId: 'a1' });
    expect(rows[0].attention?.reason).toBe('INATIVIDADE');
    expect(pinnedCount).toBe(1);
  });

  /**
   * Fixar resolve paginação; filtro é outro mecanismo. Esconder em silêncio devolveria o defeito
   * que a change existe para corrigir — por isso o contador, que a UI exibe.
   */
  it('item de atenção fora do filtro sai da lista mas é contado', () => {
    const roster = pagina([atletaResumo({ atletaId: 'r1', nome: 'Bruno', status: 'active' })]);

    const { rows, hiddenAttentionCount } = buildInboxQueue(
      roster,
      [alerta({ atletaId: 'a1', athleteName: 'Ana' })],
      { status: 'warning', search: '' },
      HOJE,
    );

    expect(rows.some((r) => r.atletaId === 'a1')).toBe(false);
    expect(hiddenAttentionCount).toBe(1);
  });

  it('busca por nome também esconde e conta', () => {
    const { rows, hiddenAttentionCount } = buildInboxQueue(
      pagina([]),
      [alerta({ atletaId: 'a1', athleteName: 'Ana' }), alerta({ atletaId: 'a2', athleteName: 'Carla' })],
      { status: 'all', search: 'car' },
      HOJE,
    );

    expect(rows.map((r) => r.atletaId)).toEqual(['a2']);
    expect(hiddenAttentionCount).toBe(1);
  });

  it('ordena por severidade e depois por priorityScore', () => {
    const attention = [
      alerta({ atletaId: 'media', athleteName: 'Media', severity: 'MEDIA', priorityScore: 99 }),
      alerta({ atletaId: 'alta', athleteName: 'Alta', severity: 'ALTA', priorityScore: 10 }),
      alerta({ atletaId: 'critica2', athleteName: 'Critica2', severity: 'CRITICA', priorityScore: 20 }),
      alerta({ atletaId: 'critica1', athleteName: 'Critica1', severity: 'CRITICA', priorityScore: 80 }),
    ];

    const { rows } = buildInboxQueue(pagina([]), attention, SEM_FILTRO, HOJE);

    expect(rows.map((r) => r.atletaId)).toEqual(['critica1', 'critica2', 'alta', 'media']);
  });

  it('preserva a ordem que o backend devolveu para o roster', () => {
    const roster = pagina([
      atletaResumo({ atletaId: 'r1', nome: 'Bruno' }),
      atletaResumo({ atletaId: 'r2', nome: 'Ana' }),
      atletaResumo({ atletaId: 'r3', nome: 'Carla' }),
    ]);

    const { rows } = buildInboxQueue(roster, [], SEM_FILTRO, HOJE);

    expect(rows.map((r) => r.atletaId)).toEqual(['r1', 'r2', 'r3']);
  });

  /**
   * Os fixados são seção acima da página, não conteúdo dela: somá-los ao `count` do
   * `TablePagination` faria "1 de N páginas" mentir e a última página vir curta.
   */
  it('não altera o total de elementos do roster', () => {
    const roster = pagina([atletaResumo({ atletaId: 'r1', nome: 'Bruno' })], { totalElements: 25, totalPages: 3 });

    const resultado = buildInboxQueue(roster, [alerta({ atletaId: 'a1', athleteName: 'Ana' })], SEM_FILTRO, HOJE);

    expect(resultado.rosterTotalElements).toBe(25);
  });

  describe('recência', () => {
    /** "Inatividade · 14d" tem de ser dias SEM TREINAR, não a idade do alerta. */
    it('inatividade usa o último treino do roster', () => {
      const roster = pagina([atletaResumo({ atletaId: 'a1', nome: 'Ana', lastActivity: '2026-08-02' })]);

      const { rows } = buildInboxQueue(
        roster,
        [alerta({ atletaId: 'a1', athleteName: 'Ana', primaryReason: 'INATIVIDADE', generatedAt: '2026-08-15T12:00:00Z' })],
        SEM_FILTRO,
        HOJE,
      );

      expect(rows[0].attention?.recencyDays).toBe(14);
    });

    it('outros motivos usam a idade do alerta', () => {
      const roster = pagina([atletaResumo({ atletaId: 'a1', nome: 'Ana', lastActivity: '2026-08-02' })]);

      const { rows } = buildInboxQueue(
        roster,
        [alerta({ atletaId: 'a1', athleteName: 'Ana', primaryReason: 'SOBRECARGA', generatedAt: '2026-08-13T12:00:00Z' })],
        SEM_FILTRO,
        HOJE,
      );

      expect(rows[0].attention?.recencyDays).toBe(3);
    });

    it('sem dado de recência devolve null em vez de zero', () => {
      const { rows } = buildInboxQueue(
        pagina([]),
        [alerta({ atletaId: 'a1', athleteName: 'Ana', primaryReason: 'INATIVIDADE', generatedAt: '' })],
        SEM_FILTRO,
        HOJE,
      );

      expect(rows[0].attention?.recencyDays).toBeNull();
    });
  });

  it('sem fila de atenção, devolve só o roster', () => {
    const roster = pagina([atletaResumo({ atletaId: 'r1', nome: 'Bruno' })]);

    const { rows, pinnedCount, hiddenAttentionCount } = buildInboxQueue(roster, [], SEM_FILTRO, HOJE);

    expect(rows).toHaveLength(1);
    expect(pinnedCount).toBe(0);
    expect(hiddenAttentionCount).toBe(0);
  });
});

describe('buildSelectedAthleteFromDashboard — diagnóstico', () => {
  const hoje = new Date(2026, 8, 28, 15, 30);
  const roster = atletaResumo({ atletaId: 'a1', nome: 'Ana', aderenciaPercentual: 38 });

  function perfil(over: Partial<AtletaPerfilCoachDto>): AtletaPerfilCoachDto {
    return {
      pmc: [],
      aderenciaSemanal: [],
      planoVigente: null,
      provas: [],
      sinaisRecentes: [],
      avisos: null,
      ...over,
    } as unknown as AtletaPerfilCoachDto;
  }

  function diario(inicio: string, dias: number, tss: (i: number) => number): PmcPontoRaw[] {
    const base = new Date(`${inicio}T12:00:00`);
    return Array.from({ length: dias }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return pmc({ data: iso, tss: tss(i), ctl: 10, atl: 20, tsb: -10 });
    });
  }

  // Série semanal que alimenta as barras do gráfico — independente de `aderencia4Semanas`, que é
  // o agregado só da janela (fix-adherence-count-until-today, D5).
  const semanasRecentes = [
    { semanaInicio: '2026-08-31', totalPlanejado: 4, totalRealizado: 0, percentual: 0 },
    { semanaInicio: '2026-09-07', totalPlanejado: 4, totalRealizado: 1, percentual: 25 },
    { semanaInicio: '2026-09-14', totalPlanejado: 4, totalRealizado: 2, percentual: 50 },
    { semanaInicio: '2026-09-21', totalPlanejado: 4, totalRealizado: 2, percentual: 50 },
    { semanaInicio: '2026-09-28', totalPlanejado: 4, totalRealizado: 0, percentual: 0 }, // em curso
  ];

  it('aderência vem de `aderencia4Semanas` do perfil — não do roster', () => {
    const row = buildSelectedAthleteFromDashboard(
      roster,
      perfil({ aderenciaSemanal: semanasRecentes, aderencia4Semanas: { realizado: 5, planejado: 16, percentual: 31 } }),
      hoje,
    );
    expect(row.adherence).toBe(31);
    expect(row.adherenceWindow).toEqual({ percent: 31, completed: 5, planned: 16, weeks: 4 });
  });

  it('perfil carregado sem nada devido na janela: tile não cai no roster (D4/D6)', () => {
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ aderenciaSemanal: semanasRecentes }), hoje);
    expect(row.adherenceWindow).toBeNull();
  });

  it('sem perfil, aderência cai no roster', () => {
    const row = buildSelectedAthleteFromDashboard(roster, null, hoje);
    expect(row.adherence).toBe(38);
    expect(row.adherenceWindow).toBeNull();
  });

  it('aderência válida continua disponível com PMC vazio', () => {
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ aderenciaSemanal: semanasRecentes, pmc: [] }), hoje);
    expect(row.adherenceAvailable).toBe(true);
    expect(row.quickStats.hasWindowData).toBe(false);
  });

  it('consulta de aderência que falhou fica indisponível, sem virar semana "sem plano"', () => {
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ avisos: ['aderenciaSemanal'] }), hoje);
    expect(row.adherenceAvailable).toBe(false);
    expect(row.pmcAvailable).toBe(true);
  });

  it('consulta de PMC que falhou fica indisponível e não gera lacuna', () => {
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ avisos: ['pmc'] }), hoje);
    expect(row.pmcAvailable).toBe(false);
    expect(row.dataGaps).toEqual([]);
  });

  it('delta de carga é TSS 7d vs 7d anteriores, não variação de CTL', () => {
    // 7 dias anteriores com TSS 10, últimos 7 com TSS 15.
    const serie = diario('2026-09-15', 14, (i) => (i >= 7 ? 15 : 10));
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ pmc: serie }), hoje);
    expect(row.loadDelta).toBe(50);
  });

  it('série e lacunas e confiança do ACWR vêm dos adapters do diagnóstico', () => {
    // Retorno de 3 dias depois de 87 dias zerados: sem base crônica.
    const serie = diario('2026-07-01', 90, (i) => (i >= 87 ? 60 : 0));
    const row = buildSelectedAthleteFromDashboard(roster, perfil({ pmc: serie }), hoje);
    expect(row.weeklyDiagnosis).toHaveLength(8);
    expect(row.quickStats.acwrConfidence?.level).toBe('BAIXA');
  });
});

describe('buildRosterRowFromSummary — defaults do diagnóstico', () => {
  it('linha de roster não finge ter série nem confiança avaliada', () => {
    const row = buildRosterRowFromSummary(atletaResumo({ atletaId: 'a1', nome: 'Ana' }));
    expect(row).toMatchObject({ adherenceWindow: null, loadDelta: null, weeklyDiagnosis: [], dataGaps: [] });
    expect(row.quickStats.acwrConfidence).toBeNull();
  });
});

/**
 * "Próximo treino" pegava `treinos[0]` — o primeiro do plano, não o próximo a partir de hoje. Na
 * terça mostrava o treino de segunda, já passado.
 */
describe('buildSelectedAthleteFromDashboard — próximo treino', () => {
  const terca = new Date(2026, 8, 29, 9, 0);
  const roster = atletaResumo({ atletaId: 'a1', nome: 'Ana' });
  const treino = (diaSemana: string, tipoTreino: string, statusExecucao = 'PENDENTE') =>
    ({ diaSemana, tipoTreino, distanciaKm: 8, statusExecucao, duracaoMin: 'PT45M', zonaAlvo: 'Z2' });
  const comPlano = (treinos: ReturnType<typeof treino>[], semanaInicio = '2026-09-28') =>
    ({
      pmc: [], aderenciaSemanal: [], provas: [], sinaisRecentes: [], avisos: null,
      planoVigente: { planoId: 'p1', semanaInicio, semanaFim: '2026-10-04', reviewStatus: 'APROVADO', treinos },
    }) as unknown as AtletaPerfilCoachDto;
  const proximo = (perfil: AtletaPerfilCoachDto, hoje = terca) => buildSelectedAthleteFromDashboard(roster, perfil, hoje).nextWorkout;

  it('pula os dias que já passaram: na terça, o de terça é "Hoje"', () => {
    const plano = comPlano([treino('SEGUNDA', 'FACIL'), treino('TERCA', 'RECUPERACAO'), treino('QUINTA', 'INTERVALADO')]);
    expect(proximo(plano)).toMatchObject({ title: formatWorkoutTypeLabel('RECUPERACAO'), when: 'Hoje' });
  });

  it('treino de hoje já feito: vai para o seguinte, com o dia por extenso', () => {
    const plano = comPlano([treino('TERCA', 'RECUPERACAO', 'REALIZADO'), treino('QUINTA', 'INTERVALADO')]);
    expect(proximo(plano)).toMatchObject({ title: formatWorkoutTypeLabel('INTERVALADO'), when: 'Quinta' });
  });

  it('amanhã e ordem de chegada fora da ordem da semana', () => {
    const plano = comPlano([treino('SABADO', 'LONGAO'), treino('QUARTA', 'FACIL')]);
    expect(proximo(plano)).toMatchObject({ title: formatWorkoutTypeLabel('FACIL'), when: 'Amanhã' });
  });

  it('plano da semana seguinte: o primeiro treino dela', () => {
    const plano = comPlano([treino('SEGUNDA', 'FACIL')], '2026-10-05');
    expect(proximo(plano)).toMatchObject({ title: formatWorkoutTypeLabel('FACIL'), when: 'Segunda' });
  });

  it('nada restante na semana: diz isso, sem mostrar treino passado', () => {
    const plano = comPlano([treino('SEGUNDA', 'FACIL')]);
    expect(proximo(plano)).toMatchObject({ title: 'Sem treino planejado', when: 'Sem data', objective: 'Nenhum treino restante no plano vigente.' });
  });
});
