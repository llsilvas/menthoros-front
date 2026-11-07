import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueueRow } from './QueueRow';
import { corDaAderencia } from './coachInboxHelpers';
import type { AttentionInfo, LinhaContexto } from '../adapters/coachInboxAdapters';
import type { CoachAthleteRow } from '../types/CoachInbox';
import { semantic, surface } from '../../../theme/tokens';

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
    adherenceAvailable: true,
    load7d: 40,
    loadDelta: 0,
    delay: 0,
    nextWorkout: { title: 'Longão', when: 'sáb', zone: 'Z2', duration: '60min', distance: '10km', objective: 'Base' },
    raceCalendar: [],
    notes: '',
    suggestedActions: [],
    ...over,
  } as CoachAthleteRow;
}

function atencao(over: Partial<AttentionInfo> = {}): AttentionInfo {
  return { severity: 'ALTA', reason: 'INATIVIDADE', suggestedAction: 'Entrar em contato', recencyDays: 14, recencyKind: 'sem-treino', ...over };
}

const CONTEXTO_SINAL: LinhaContexto = { texto: 'Inatividade · 14 dias sem treino', tom: 'danger' };
const CONTEXTO_NEUTRO: LinhaContexto = { texto: 'Base · último treino há 2 dias', tom: 'neutral' };

/** jsdom devolve `rgb(...)`; os tokens são hex. */
function hexParaRgb(hex: string): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

describe('QueueRow', () => {
  it('renderiza o atleta e responde ao clique', async () => {
    const onClick = vi.fn();
    render(<QueueRow athlete={atleta()} contexto={CONTEXTO_NEUTRO} selected={false} onClick={onClick} />);

    await userEvent.click(screen.getByText('Ana Silva'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * inbox-lista-triagem: a crítica mediu "Alerta" duas vezes por card (chip + linha de motivo) e
   * a aderência três (rótulo, número, barra). A linha tem UMA linha de contexto e UM número.
   */
  it('uma linha de contexto, sem chip e sem barra; a severidade está na cor do texto', () => {
    render(<QueueRow athlete={atleta()} attention={atencao()} contexto={CONTEXTO_SINAL} selected={false} onClick={vi.fn()} />);

    const motivo = screen.getByTestId('queue-row-motivo');
    expect(motivo).toHaveTextContent('Inatividade · 14 dias sem treino');
    expect(getComputedStyle(motivo).color).toBe(hexParaRgb(semantic.danger[500]));
    expect(document.querySelector('.MuiChip-root')).toBeNull();
    expect(document.querySelector('.MuiLinearProgress-root')).toBeNull();
    expect(screen.getAllByText(/inatividade/i)).toHaveLength(1);
  });

  it('sinal médio usa âmbar; sem sinal o contexto é neutro', () => {
    const { rerender } = render(
      <QueueRow athlete={atleta()} attention={atencao({ severity: 'MEDIA' })} contexto={{ texto: 'Aderência · sinal há 4 dias', tom: 'warning' }} selected={false} onClick={vi.fn()} />,
    );
    expect(getComputedStyle(screen.getByTestId('queue-row-motivo')).color).toBe(hexParaRgb(semantic.warning[500]));

    rerender(<QueueRow athlete={atleta()} contexto={CONTEXTO_NEUTRO} selected={false} onClick={vi.fn()} />);
    expect(screen.getByTestId('queue-row-motivo')).toHaveTextContent('Base · último treino há 2 dias');
    expect(getComputedStyle(screen.getByTestId('queue-row-motivo')).color).toBe(hexParaRgb(surface[400]));
  });

  it('aderência: número mono uma vez, cor pelo valor, "—" quando indisponível', () => {
    const { rerender } = render(<QueueRow athlete={atleta({ adherence: 91 })} contexto={CONTEXTO_NEUTRO} selected={false} onClick={vi.fn()} />);
    expect(screen.getByTestId('queue-row-aderencia')).toHaveTextContent('91%');
    expect(screen.getAllByText(/91%/)).toHaveLength(1);
    expect(getComputedStyle(screen.getByTestId('queue-row-aderencia')).color).toBe(hexParaRgb(semantic.success[500]));

    rerender(<QueueRow athlete={atleta({ adherence: 0, adherenceAvailable: false })} contexto={CONTEXTO_NEUTRO} selected={false} onClick={vi.fn()} />);
    expect(screen.getByTestId('queue-row-aderencia')).toHaveTextContent('—');
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('corDaAderencia: ≥ 85 sucesso, ≥ 70 neutro, abaixo aviso', () => {
    expect(corDaAderencia(85)).toBe(semantic.success[500]);
    expect(corDaAderencia(70)).toBe(surface[200]);
    expect(corDaAderencia(69)).toBe(semantic.warning[500]);
  });

  /** Texto funcional abaixo de 11px é o defeito nº 2 da auditoria; a linha nova não pode repetí-lo. */
  it('o contexto respeita a fonte mínima de 11px e não usa surface-500', () => {
    render(<QueueRow athlete={atleta()} attention={atencao()} contexto={CONTEXTO_SINAL} selected={false} onClick={vi.fn()} />);

    const motivo = screen.getByTestId('queue-row-motivo');
    const declarado = getComputedStyle(motivo).fontSize;
    const px = declarado.endsWith('rem') ? Number.parseFloat(declarado) * 16 : Number.parseFloat(declarado);
    expect(px).toBeGreaterThanOrEqual(11);
    expect(getComputedStyle(motivo).color).not.toBe(hexParaRgb(surface[500]));
  });

  it('selecionada marca aria-current', () => {
    render(<QueueRow athlete={atleta()} contexto={CONTEXTO_NEUTRO} selected onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ana silva/i })).toHaveAttribute('aria-current', 'true');
  });
});
