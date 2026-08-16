import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueueRow } from './QueueRow';
import type { AttentionInfo } from '../adapters/coachInboxAdapters';
import type { CoachAthleteRow } from '../types/CoachInbox';
import { semantic } from '../../../theme/tokens';

function atleta(over: Partial<CoachAthleteRow> = {}): CoachAthleteRow {
  return {
    id: 'a1',
    name: 'Ana Silva',
    discipline: 'Corrida',
    age: 30,
    nivelExperiencia: null,
    gender: 'F',
    weeksOnPlan: 4,
    segment: 'stable',
    planStatus: 'NO_PRAZO',
    trainingType: 'Corrida',
    status: 'active',
    statusLabel: 'No prazo',
    decision: 'PENDING',
    adherence: 80,
    load7d: 40,
    loadDelta: 0,
    delay: 0,
    nextWorkout: { title: 'Longão', when: 'sáb', zone: 'Z2', duration: '60min', distance: '10km', objective: 'Base' },
    raceCalendar: [],
    loadTrend: [40],
    adherenceTrend: [80],
    notes: '',
    suggestedActions: [],
    ...over,
  } as CoachAthleteRow;
}

function atencao(over: Partial<AttentionInfo> = {}): AttentionInfo {
  return { severity: 'ALTA', reason: 'INATIVIDADE', suggestedAction: 'Entrar em contato', recencyDays: 14, ...over };
}

describe('QueueRow', () => {
  it('renderiza o atleta e responde ao clique', async () => {
    const onClick = vi.fn();
    render(<QueueRow athlete={atleta()} selected={false} onClick={onClick} />);

    await userEvent.click(screen.getByText('Ana Silva'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('sinal de atenção', () => {
    /**
     * O motivo é o que a auditoria apontou como ausente: o coach via o badge "Alerta" (9,9px) sem
     * saber **por quê**. Sem motivo e recência no card, ele precisa abrir cada atleta para
     * descobrir — o oposto de uma tela de triagem.
     */
    it('mostra motivo e recência quando há sinal', () => {
      render(<QueueRow athlete={atleta()} attention={atencao()} selected={false} onClick={vi.fn()} />);

      expect(screen.getByText(/inatividade/i)).toBeInTheDocument();
      expect(screen.getByText(/14d/)).toBeInTheDocument();
    });

    /** Sem o dado, escrever "0d" afirmaria "treinou hoje" — o contrário do que se sabe. */
    it('omite a recência quando não há dado, em vez de exibir zero', () => {
      render(<QueueRow athlete={atleta()} attention={atencao({ recencyDays: null })} selected={false} onClick={vi.fn()} />);

      expect(screen.getByText(/inatividade/i)).toBeInTheDocument();
      expect(screen.queryByText(/0d/)).not.toBeInTheDocument();
    });

    it('sem sinal, não inventa linha de motivo', () => {
      render(<QueueRow athlete={atleta()} selected={false} onClick={vi.fn()} />);

      expect(screen.queryByText(/inatividade/i)).not.toBeInTheDocument();
    });

    /**
     * Diferenciação não-cor (task 2.4 antecipada aqui porque o elemento nasce agora): o estado não
     * pode depender só da cor da borda — daltônico não a distingue. O rótulo textual é o portador
     * primário da informação.
     */
    it('o estado é legível sem depender de cor', () => {
      const { rerender } = render(
        <QueueRow athlete={atleta()} attention={atencao({ severity: 'CRITICA' })} selected={false} onClick={vi.fn()} />,
      );
      expect(screen.getByText(/alerta/i)).toBeInTheDocument();

      rerender(<QueueRow athlete={atleta()} attention={atencao({ severity: 'MEDIA' })} selected={false} onClick={vi.fn()} />);
      expect(screen.getByText(/atenção/i)).toBeInTheDocument();
    });

    /** Texto funcional abaixo de 11px é o defeito nº 2 da auditoria; a linha nova não pode repetí-lo. */
    it('o motivo respeita a fonte mínima de 11px', () => {
      render(<QueueRow athlete={atleta()} attention={atencao()} selected={false} onClick={vi.fn()} />);

      const motivo = screen.getByTestId('queue-row-motivo');
      // jsdom devolve o valor declarado ("0.72rem"), sem resolver para px — a conversão é nossa,
      // assumindo o root de 16px do documento.
      const declarado = getComputedStyle(motivo).fontSize;
      const px = declarado.endsWith('rem')
        ? Number.parseFloat(declarado) * 16
        : Number.parseFloat(declarado);

      expect(px).toBeGreaterThanOrEqual(11);
    });
  });

  describe('cor do chip de status', () => {
    /**
     * O chip misturava duas fontes: o RÓTULO vinha do status do atleta ("Ativo") e a COR vinha da
     * decisão do plano — que no roster é `'PENDING'` fixo. Resultado: todo card saía âmbar, mesmo
     * o do atleta ativo. Âmbar num atleta sem pendência diz "observe este" sem motivo, que é ruído
     * onde a tela deveria estar silenciosa.
     */
    const corDoChip = (status: CoachAthleteRow['status']) => {
      const { unmount } = render(
        <QueueRow athlete={atleta({ status, statusLabel: 'X' })} selected={false} onClick={vi.fn()} />,
      );
      const chip = screen.getByText('X').closest('.MuiChip-root') as HTMLElement;
      const cor = getComputedStyle(chip).color;
      unmount();
      return cor;
    };

    it('ativo, atenção e alerta têm cores distintas entre si', () => {
      const ativo = corDoChip('active');
      const atencao = corDoChip('warning');
      const alerta = corDoChip('danger');

      expect(new Set([ativo, atencao, alerta]).size).toBe(3);
    });

    it('o atleta ativo usa a cor de sucesso, não a de atenção', () => {
      expect(corDoChip('active')).toBe(hexParaRgb(semantic.success[500]));
      expect(corDoChip('active')).not.toBe(hexParaRgb(semantic.warning[500]));
    });

    it('atenção usa âmbar e alerta usa vermelho', () => {
      expect(corDoChip('warning')).toBe(hexParaRgb(semantic.warning[500]));
      expect(corDoChip('danger')).toBe(hexParaRgb(semantic.danger[500]));
    });
  });
});

/** jsdom devolve `rgb(...)`; os tokens são hex. */
function hexParaRgb(hex: string): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
