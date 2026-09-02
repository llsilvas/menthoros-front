import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AthleteRacesPanel } from './AthleteRacesPanel';
import type { CoachRaceView } from '../adapters/coachRaceAdapters';

const pendente: CoachRaceView = {
  id: 'a', nome: 'Maratona SP', dataLabel: '6 de dez de 2026', distanciaLabel: '42 km', alvo: true, cancelada: false,
  semanasFaltando: 13, semanasMinimas: 16, preparacaoCurta: true, tempoObjetivo: '03:45:00',
  pendente: { motivo: 'ALVO_TROCADA', label: 'Alvo trocada (antes Meia do Rio)' },
};
const revisada: CoachRaceView = {
  id: 'b', nome: 'Trilha', dataLabel: '25 de out de 2026', distanciaLabel: '30 km', alvo: false, cancelada: false,
  semanasFaltando: 7, semanasMinimas: 12, preparacaoCurta: false, pendente: null,
};
const cancelada: CoachRaceView = {
  id: 'c', nome: 'Corrida do Parque', dataLabel: '20 de set de 2026', distanciaLabel: '5 km', alvo: false, cancelada: true,
  semanasFaltando: 2, preparacaoCurta: false, pendente: { motivo: 'CANCELADA', label: 'Cancelada pelo atleta' },
};

describe('AthleteRacesPanel', () => {
  it('item pendente mostra chips e o botão Ciente; item revisado não mostra o botão', async () => {
    const onCiente = vi.fn();
    render(<AthleteRacesPanel races={[pendente, revisada, cancelada]} loading={false} error={null} acting={false} onCiente={onCiente} onRetry={vi.fn()} />);

    const rows = screen.getAllByTestId('coach-race-row');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Alvo')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Preparação curta')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Alvo trocada (antes Meia do Rio)')).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent('faltam 13 de 16 semanas');
    expect(within(rows[1]).queryByRole('button', { name: /ciente/i })).toBeNull();
    expect(within(rows[2]).getByText('Cancelada')).toBeInTheDocument();

    await userEvent.click(within(rows[0]).getByRole('button', { name: /ciente/i }));
    expect(onCiente).toHaveBeenCalledWith('a');
  });

  it('estados vazio, carregando e erro', () => {
    const { rerender } = render(<AthleteRacesPanel races={[]} loading={false} error={null} acting={false} onCiente={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText(/nenhuma prova futura cadastrada/i)).toBeInTheDocument();

    rerender(<AthleteRacesPanel races={[]} loading error={null} acting={false} onCiente={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<AthleteRacesPanel races={[]} loading={false} error={new Error('x')} acting={false} onCiente={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText(/não foi possível carregar as provas/i)).toBeInTheDocument();
  });
});
