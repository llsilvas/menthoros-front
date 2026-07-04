import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostWorkoutFeedbackCard } from './PostWorkoutFeedbackCard';
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

describe('PostWorkoutFeedbackCard', () => {
  it('renderiza tipo, duração, distância, TSS e a mensagem default', () => {
    render(<PostWorkoutFeedbackCard treino={treino()} onVoltar={vi.fn()} />);

    expect(screen.getByText('🏃 Corrida contínua')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('10.0 km')).toBeInTheDocument();
    expect(screen.getByText('TSS 62')).toBeInTheDocument();
    expect(screen.getByText('Bom treino! Mantenha a consistência.')).toBeInTheDocument();
  });

  it('RPE alto mostra mensagem de recuperação', () => {
    render(<PostWorkoutFeedbackCard treino={treino({ percepcaoEsforco: 9 })} onVoltar={vi.fn()} />);
    expect(screen.getByText('Grande esforço! Respeite a recuperação.')).toBeInTheDocument();
  });

  it('RPE baixo mostra mensagem de ativação', () => {
    render(<PostWorkoutFeedbackCard treino={treino({ percepcaoEsforco: 3 })} onVoltar={vi.fn()} />);
    expect(screen.getByText('Bom treino leve! Ativação no ponto.')).toBeInTheDocument();
  });

  it('omite a linha de distância quando ausente (não fabrica "0 km")', () => {
    render(<PostWorkoutFeedbackCard treino={treino({ distanciaKm: undefined })} onVoltar={vi.fn()} />);
    expect(screen.queryByText(/km/)).toBeNull();
  });

  it('tipo desconhecido usa o label cru, sem quebrar', () => {
    render(
      <PostWorkoutFeedbackCard
        treino={treino({ tipoTreino: 'INEXISTENTE' as TreinoRealizadoDto['tipoTreino'] })}
        onVoltar={vi.fn()}
      />,
    );
    expect(screen.getByText('INEXISTENTE')).toBeInTheDocument();
  });

  it('chama onVoltar ao clicar em "Voltar para Home"', async () => {
    const onVoltar = vi.fn();
    const user = userEvent.setup();
    render(<PostWorkoutFeedbackCard treino={treino()} onVoltar={onVoltar} />);

    await user.click(screen.getByRole('button', { name: /voltar para home/i }));

    expect(onVoltar).toHaveBeenCalled();
  });
});
