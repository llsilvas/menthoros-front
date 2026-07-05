import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FitUploadResultCard } from './FitUploadResultCard';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

const TREINO: TreinoRealizadoDto = {
  id: 't1',
  dataTreino: '2026-07-01',
  tipoTreino: 'CONTINUO',
  duracaoMin: '00:30:00',
  distanciaKm: 5,
  fcMedia: 150,
  tssCalculado: 62,
  fonteDados: { value: 'MANUAL', label: 'Manual' },
  status: { value: 'REALIZADO', label: 'Realizado' },
  etapasRealizadas: [{}, {}],
};

describe('FitUploadResultCard', () => {
  it('renderiza duração, distância, FC e laps extraídos do treino', () => {
    render(<FitUploadResultCard treino={TREINO} onImportarOutro={vi.fn()} onVoltar={vi.fn()} />);

    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('5.0 km')).toBeInTheDocument();
    expect(screen.getByText('FC média 150 bpm')).toBeInTheDocument();
    expect(screen.getByText('2 laps')).toBeInTheDocument();
  });

  it('não quebra e omite linhas quando dados são parciais', () => {
    render(
      <FitUploadResultCard
        treino={{ ...TREINO, distanciaKm: undefined, fcMedia: undefined, etapasRealizadas: [] }}
        onImportarOutro={vi.fn()}
        onVoltar={vi.fn()}
      />
    );

    expect(screen.queryByText(/km$/)).toBeNull();
    expect(screen.queryByText(/FC média/)).toBeNull();
    expect(screen.queryByText(/laps?/)).toBeNull();
  });

  it('chama onImportarOutro ao clicar em "Importar outro"', async () => {
    const onImportarOutro = vi.fn();
    render(<FitUploadResultCard treino={TREINO} onImportarOutro={onImportarOutro} onVoltar={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /importar outro/i }));

    expect(onImportarOutro).toHaveBeenCalledOnce();
  });

  it('chama onVoltar ao clicar em "Voltar para Home"', async () => {
    const onVoltar = vi.fn();
    render(<FitUploadResultCard treino={TREINO} onImportarOutro={vi.fn()} onVoltar={onVoltar} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /voltar para home/i }));

    expect(onVoltar).toHaveBeenCalledOnce();
  });
});
