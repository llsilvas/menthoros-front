import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosisTabPanel } from './DiagnosisTabPanel';
import type { CoachAthleteRow, WeeklyDiagnosisPoint } from '../../types/CoachInbox';
import type { CoachAttentionItem } from '../../../../types/Coach';

const SEMANA: WeeklyDiagnosisPoint = {
  weekStart: '2026-09-21',
  label: '21/09',
  tss: 120,
  activeDays: 3,
  planned: 4,
  completed: 3,
  adherence: 75,
  noData: false,
  current: true,
  distanceKm: null,
};

function atleta(over: Partial<CoachAthleteRow> = {}): CoachAthleteRow {
  return {
    id: 'a1',
    name: 'Ana Silva',
    discipline: 'Corrida',
    age: 30,
    nivelExperiencia: null,
    gender: 'F',
    weeksOnPlan: 4,
    segment: 'attention',
    planStatus: 'NO_PRAZO',
    trainingType: 'Corrida',
    statusLabel: 'No prazo',
    decision: 'PENDING',
    adherence: 62,
    adherenceWindow: { percent: 62, completed: 10, planned: 16, weeks: 4 },
    adherenceAvailable: true,
    pmcAvailable: true,
    load7d: 40,
    loadDelta: -5,
    delay: 1,
    nextWorkout: { title: 'Longão', when: 'sáb', zone: 'Z2', duration: '60min', distance: '10km', objective: 'Base' },
    raceCalendar: [],
    loadTrend: [30, 35, 40],
    adherenceTrend: [70, 65, 62],
    weeklyDiagnosis: [SEMANA],
    dataGaps: [],
    notes: 'Aderência caiu 20% nas últimas duas semanas.',
    suggestedActions: ['Reduzir volume', 'Conversar sobre a rotina'],
    quickStats: {
      hasWindowData: true,
      acuteLoad: 21.14,
      monotony: 1.4,
      trainingDays7d: 4,
      strain: 200,
      acwr: 1.1,
      acwrConfidence: { level: 'ALTA', reason: null },
      statusForma: null,
    },
    racePrediction: null,
    ...over,
  } as CoachAthleteRow;
}

const posicaoDe = (texto: RegExp) => {
  const elemento = screen.getByText(texto);
  return Array.from(document.querySelectorAll('*')).indexOf(elemento);
};

const LIMIARES = {
  fcLimiarEstimado: 168,
  paceLimiarEstimadoFormatado: '4:35/km',
  confiancaInferenciaFc: 'ALTA',
  confiancaInferenciaPace: 'MEDIA',
  dataInferenciaLimiar: '2026-08-01',
} as const;

describe('DiagnosisTabPanel', () => {
  /**
   * UX-002 da auditoria: o insight da IA — o *porquê* — ficava no fim do painel, depois de todas as
   * métricas e gráficos. O coach decide pelo motivo, não pelo número cru; a métrica é evidência do
   * insight, não o contrário. Este teste fixa a ordem para que ninguém a reverta sem notar.
   */
  it('mostra os sinais de atenção ANTES das métricas', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(posicaoDe(/sinais de atenção/i)).toBeLessThan(posicaoDe(/carga aguda/i));
  });

  it('mostra os sinais de atenção ANTES das tendências', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(posicaoDe(/sinais de atenção/i)).toBeLessThan(posicaoDe(/adesão e carga por semana/i));
  });

  it('exibe o diagnóstico e as ações sugeridas do atleta', () => {
    render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

    expect(screen.getByText(/aderência caiu 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/reduzir volume/i)).toBeInTheDocument();
  });

  describe('faixas de referência', () => {
    /**
     * UX-005: "Ideal: 110-150 km" e "Ideal: < 2.0" eram fixos e iguais para todo mundo — o mesmo
     * intervalo para um iniciante de 20 km/semana e para um maratonista. Uma referência que não
     * considera o atleta não é referência, é ruído com aparência de precisão.
     *
     * Decisão do founder: remover, em vez de derivar um número que pareceria mais preciso do que é.
     */
    it('não exibe faixas "ideais" fixas', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.queryByText(/ideal:/i)).not.toBeInTheDocument();
    });

    /**
     * "Recuperação" era a aderência da última semana (normalmente a semana em curso), com outro nome.
     * Saiu; no lugar, a forma prevista no dia da prova, que o coach usa para decidir o taper.
     */
    it('métricas no padrão da faixa: carga aguda em TSS/dia, forma prevista no lugar de recuperação', () => {
      render(
        <DiagnosisTabPanel
          selected={atleta({ racePrediction: { diasAteProva: 20, tsbPrevisto: 3.2, formaPrevista: 'form_stable' } })}
          pmc={[]}
          onOpenPlan={vi.fn()}
        />,
      );

      expect(screen.queryByText(/Recuperação/)).not.toBeInTheDocument();
      expect(within(screen.getByTestId('metric-acuteLoad')).getByText('21,1 TSS/dia')).toBeInTheDocument();
      expect(within(screen.getByTestId('metric-monotony')).getByText('1,40')).toBeInTheDocument();
      expect(within(screen.getByTestId('metric-strain')).getByText('200')).toBeInTheDocument();
      const forma = within(screen.getByTestId('metric-racePrediction'));
      expect(forma.getByText('Forma prevista')).toBeInTheDocument();
      expect(forma.getByText('Estável')).toBeInTheDocument();
      expect(forma.getByText('TSB +3,2 em 20 dias, sem carga até a prova')).toBeInTheDocument();
    });

    it('monotonia sem base não mostra número', () => {
      render(
        <DiagnosisTabPanel
          selected={atleta({ quickStats: { ...atleta().quickStats, monotony: null, strain: null, trainingDays7d: 2 } })}
          pmc={[]}
          onOpenPlan={vi.fn()}
        />,
      );

      const monotonia = within(screen.getByTestId('metric-monotony'));
      expect(monotonia.getByText('—')).toBeInTheDocument();
      expect(monotonia.getByText('Sem base: 2 dias com treino (mínimo 3)')).toBeInTheDocument();
    });
  });

  describe('sem dados na janela', () => {
    /**
     * Sem série PMC, o adapter preenche carga com 0 e monotonia com 1.00 — e ambos caem em tone
     * "adequado". O coach lia "carga 0 km, monotonia 1.00, tudo verde" para um atleta que nunca
     * sincronizou nada. Zero por ausência de dado não é zero medido.
     */
    it('substitui a grade de métricas por uma mensagem', () => {
      render(
        <DiagnosisTabPanel
          selected={atleta({ quickStats: { ...atleta().quickStats, hasWindowData: false } })}
          pmc={[]}
          onOpenPlan={vi.fn()}
        />,
      );

      expect(screen.getByText(/sem treinos registrados/i)).toBeInTheDocument();
      expect(screen.queryByText(/carga aguda/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/monotonia/i)).not.toBeInTheDocument();
    });

    /** O insight continua visível: é o que resta de útil quando não há número. */
    it('mantém os sinais de atenção visíveis', () => {
      render(
        <DiagnosisTabPanel
          selected={atleta({ quickStats: { ...atleta().quickStats, hasWindowData: false } })}
          pmc={[]}
          onOpenPlan={vi.fn()}
        />,
      );

      expect(screen.getByText(/sinais de atenção/i)).toBeInTheDocument();
    });

    it('com dados, a grade aparece normalmente', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.getByText(/carga aguda/i)).toBeInTheDocument();
      expect(screen.queryByText(/sem treinos registrados/i)).not.toBeInTheDocument();
    });
  });

  describe('adesão e carga por semana (fix-coach-diagnosis-charts)', () => {
    /**
     * "Tendência de carga" plotava CTL diário (condicionamento) com tooltip "Ponto N · Valor", e a
     * adesão vinha em barras "S1…Sn" sem data. Os dois viraram um gráfico semanal único.
     */
    it('não exibe mais os cards antigos', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.queryByText(/tendência de carga/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/adesão nas últimas semanas/i)).not.toBeInTheDocument();
    });

    it('descreve a lacuna de registro em texto', () => {
      render(
        <DiagnosisTabPanel
          selected={atleta({ dataGaps: [{ start: '2026-07-16', end: '2026-09-13', days: 60, open: false, kind: 'SEM_REGISTRO' }] })}
          pmc={[]}
          onOpenPlan={vi.fn()}
        />,
      );

      expect(screen.getByText('Sem treinos registrados de 16/07 a 13/09 (60 dias)')).toBeInTheDocument();
    });

    it('consulta de aderência que falhou aparece como indisponível, não como "sem plano"', () => {
      render(<DiagnosisTabPanel selected={atleta({ adherenceAvailable: false })} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.getByText('Adesão: dado indisponível')).toBeInTheDocument();
    });

    it('consulta de PMC que falhou: Forma (PMC) diz indisponível, não "sem histórico"', () => {
      render(<DiagnosisTabPanel selected={atleta({ pmcAvailable: false })} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.getByText('Dado indisponível')).toBeInTheDocument();
      expect(screen.queryByText(/sem histórico de pmc/i)).not.toBeInTheDocument();
    });
  });

  describe('Sinais de atenção no mesmo card dos gráficos', () => {
    it('sem sinal ativo: subtítulo diz que o conteúdo é o resumo do perfil', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Sinais de atenção' }));
      expect(card.getByText('Nenhum sinal ativo na fila de atenção · resumo do perfil')).toBeInTheDocument();
    });

    it('com sinal ativo: subtítulo anuncia a estrutura do insight', () => {
      const item = {
        atletaId: 'a1', athleteName: 'Ana Silva', severity: 'ALTA', priorityScore: 90, primaryReason: 'ADERENCIA',
        suggestedAction: 'Falar com a atleta.', generatedAt: '2026-09-28T12:00:00Z', evidence: [],
        explanation: { rationale: 'Três treinos perdidos.', sourceRules: [], confidence: 'HIGH' },
      } as unknown as CoachAttentionItem;
      render(<DiagnosisTabPanel selected={atleta()} attentionItem={item} pmc={[]} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Sinais de atenção' }));
      expect(card.getByText('Por que este atleta está na fila · evidência e ação sugerida')).toBeInTheDocument();
      expect(card.getByText('Três treinos perdidos.')).toBeInTheDocument();
    });
  });

  describe('Próximo treino e Limiares no mesmo card', () => {
    it('próximo treino: subtítulo e "Abrir plano" no cabeçalho', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Próximo treino' }));
      expect(card.getByText('Primeiro treino pendente do plano vigente, a partir de hoje')).toBeInTheDocument();
      expect(card.getByRole('button', { name: /abrir plano/i })).toBeInTheDocument();
    });

    it('limiares: subtítulo diz de onde vêm', () => {
      render(<DiagnosisTabPanel selected={atleta()} limiareisInferidos={LIMIARES} pmc={[]} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Limiares inferidos' }));
      expect(card.getByText('Estimados pelos treinos dos últimos 30 dias')).toBeInTheDocument();
    });
  });

  describe('cards dos gráficos no padrão da Proposta (patch v2)', () => {
    const pmc = Array.from({ length: 30 }, (_, i) => ({ date: new Date(2026, 8, i - 1), tss: 50, ctl: 40, atl: 45, tsb: -5 }));

    it('gráfico semanal: subtítulo diz o que mede e a unidade; legenda da escala no cabeçalho', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Adesão e carga por semana' }));
      expect(card.getByText('Últimas 8 semanas · acima: adesão (treinos feitos / planejados) · abaixo: carga em TSS')).toBeInTheDocument();
      expect(card.getByRole('list', { name: 'Escala de adesão' })).toBeInTheDocument();
    });

    it('com km do backend, o subtítulo diz km', () => {
      const semanas = atleta().weeklyDiagnosis.map((w) => ({ ...w, distanceKm: 12 }));
      render(<DiagnosisTabPanel selected={atleta({ weeklyDiagnosis: semanas })} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.getByText(/abaixo: carga em km$/)).toBeInTheDocument();
    });

    it('PMC: modo e período no cabeçalho do card; subtítulo acompanha o modo', async () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={pmc} onOpenPlan={vi.fn()} />);

      const card = within(screen.getByRole('region', { name: 'Forma (PMC)' }));
      expect(card.getByText('Condicionamento, cansaço e forma diários')).toBeInTheDocument();
      await userEvent.click(card.getByRole('button', { name: 'Simples' }));
      expect(card.getByText('Forma diária (TSB), colorida pela faixa')).toBeInTheDocument();
      const periodos = within(card.getByRole('group', { name: 'Período' }));
      expect(periodos.getAllByRole('button').map((b) => b.textContent)).toEqual(['4s', '8s', '12s']);
    });

    it('PMC sem série: sem controles', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(within(screen.getByRole('region', { name: 'Forma (PMC)' })).queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('ordem das seções (task 2.12)', () => {
    /**
     * A sequência é situação → evidência → explicação → ação → detalhe. Adesão é **a evidência**
     * dos motivos de engajamento (`ADERENCIA`, `INATIVIDADE`), os mais comuns na fila — vem antes
     * da forma.
     */
    it('adesão e carga vêm antes da forma', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(posicaoDe(/adesão e carga por semana/i)).toBeLessThan(posicaoDe(/forma \(pmc\)/i));
    });

    /** "Próximo treino" é ação/contexto: vem depois da evidência, não antes dela. */
    it('próximo treino vem depois da adesão', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(posicaoDe(/adesão e carga por semana/i)).toBeLessThan(posicaoDe(/próximo treino/i));
    });

    it('a ordem completa é situação → evidência → ação → detalhe', () => {
      render(<DiagnosisTabPanel selected={atleta()} limiareisInferidos={LIMIARES} pmc={[]} onOpenPlan={vi.fn()} />);

      const ordem = [
        posicaoDe(/sinais de atenção/i),
        posicaoDe(/carga aguda/i),
        posicaoDe(/adesão e carga por semana/i),
        posicaoDe(/forma \(pmc\)/i),
        posicaoDe(/próximo treino/i),
        posicaoDe(/limiares inferidos/i),
      ];

      expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
    });
  });

  describe('aviso de backfill de PMC [task 6.2b]', () => {
    const PONTO_PMC = { date: new Date('2026-08-01'), tss: 50, ctl: 40, atl: 35, tsb: 5 };

    it('não mostra o aviso quando não há série PMC', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[]} onOpenPlan={vi.fn()} />);

      expect(screen.queryByText('Histórico de PMC atualizado')).not.toBeInTheDocument();
    });

    it('mostra o aviso quando há série PMC', () => {
      render(<DiagnosisTabPanel selected={atleta()} pmc={[PONTO_PMC]} onOpenPlan={vi.fn()} />);

      expect(screen.getByText('Histórico de PMC atualizado')).toBeInTheDocument();
    });
  });
});
