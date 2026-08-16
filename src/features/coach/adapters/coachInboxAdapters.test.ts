import { describe, expect, it } from 'vitest';
import { buildInboxQueue, calcularMonotonia, calcularLoadDelta, calcularAcwr, getAcwrZone, getAcuteLoadTone, getMonotonyTone, calcularStrain, getStrainZone, calcularPrevisaoForma, calcularDiasAteProva } from './coachInboxAdapters';
import type { PmcPontoRaw, AtletaPerfilCoachDto } from '../../../types/AtletaPerfilCoach';
import type { Prova } from '../../../types/Prova';
import type { CoachAtletaResumo, CoachAttentionItem, CoachDashboardRosterPage } from '../../../types/Coach';

function pmc(over: Partial<PmcPontoRaw>): PmcPontoRaw {
  return { data: '2026-06-01', ctl: 50, atl: 55, tsb: -5, tss: 80, ...over };
}

function profileComProvas(datas: string[]): AtletaPerfilCoachDto {
  return {
    provas: datas.map((d, i) => ({ nomeProva: `Prova ${i}`, dataProva: d } as Prova)),
  } as AtletaPerfilCoachDto;
}

describe('calcularMonotonia', () => {
  it('retorna 1.0 com menos de 3 pontos (fallback)', () => {
    expect(calcularMonotonia([])).toBe(1.0);
    expect(calcularMonotonia([pmc({ tss: 80 }), pmc({ tss: 90 })])).toBe(1.0);
  });

  it('retorna 1.0 quando stddev é zero (treinos idênticos)', () => {
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 70 }));
    expect(calcularMonotonia(pts)).toBe(1.0);
  });

  it('calcula mean/stddev para série variada (BVA: exatamente 3 pontos)', () => {
    const pts = [pmc({ tss: 70 }), pmc({ tss: 80 }), pmc({ tss: 90 })];
    const result = calcularMonotonia(pts);
    expect(result).toBeGreaterThan(1.0);
    expect(result).toBeLessThan(15.0);
  });

  it('usa apenas os últimos 7 pontos de um array maior', () => {
    const pts = [
      pmc({ tss: 200 }), pmc({ tss: 200 }), pmc({ tss: 200 }),
      pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }),
      pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }), pmc({ tss: 70 }),
    ];
    expect(calcularMonotonia(pts)).toBe(1.0);
  });

  it('ignora pontos com tss zero ou ausente', () => {
    const pts = [pmc({ tss: 0 }), pmc({ tss: 0 }), pmc({ tss: 80 }), pmc({ tss: 90 })];
    expect(calcularMonotonia(pts)).toBe(1.0);
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

describe('getAcuteLoadTone', () => {
  it('BVA: 120 ainda é success (limiar é > 120)', () => {
    expect(getAcuteLoadTone(120)).toBe('success');
    expect(getAcuteLoadTone(121)).toBe('warning');
  });
});

describe('getMonotonyTone', () => {
  it('BVA: 1.4 ainda é success (limiar é > 1.4)', () => {
    expect(getMonotonyTone(1.4)).toBe('success');
    expect(getMonotonyTone(1.5)).toBe('warning');
  });
});

describe('calcularStrain', () => {
  it('retorna null com menos de 3 pontos de TSS', () => {
    expect(calcularStrain([])).toBeNull();
    expect(calcularStrain([pmc({ tss: 80 }), pmc({ tss: 90 })])).toBeNull();
  });

  it('retorna null quando todos os tss são zero', () => {
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 0 }));
    expect(calcularStrain(pts)).toBeNull();
  });

  it('strain = TSS_semanal × monotonia para treinos idênticos (monotonia=1.0)', () => {
    // 7 × 70 = 490, monotonia 1.0 → 490
    const pts = Array.from({ length: 7 }, () => pmc({ tss: 70 }));
    expect(calcularStrain(pts)).toBe(490);
  });

  it('strain supera o TSS semanal quando há variabilidade (monotonia > 1)', () => {
    const pts = [
      pmc({ tss: 30 }), pmc({ tss: 30 }), pmc({ tss: 150 }),
      pmc({ tss: 30 }), pmc({ tss: 150 }), pmc({ tss: 30 }), pmc({ tss: 150 }),
    ];
    const tssSemanal = 30 + 30 + 150 + 30 + 150 + 30 + 150; // 570
    expect(calcularStrain(pts)).toBeGreaterThan(tssSemanal);
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
  return { status: 'active', weeklyVolume: 30, ...over };
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
