import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { AthleteZonesDialogHost } from './AthleteZonesDialogHost';

vi.mock('../../../hooks/useAthleteTrainingZones');
vi.mock('../../../api/services/CoachAthleteZonesService');

const ZONAS: AthleteTrainingZonesDto = {
  modelo: 'LTHR_FRIEL',
  ancoras: { fcLimiar: 168, fcLimiarEstimada: false },
  ajusteFadiga: { segundosPorKm: 0 },
  fcMaxima: { bpm: 186, estimada: false },
  disponibilidade: { pace: true, fc: true },
  zonas: [],
};

const hook = (over: Partial<ReturnType<typeof useAthleteTrainingZones>>) =>
  vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: ZONAS, loading: false, error: null, fetchZones: vi.fn(), ...over });

const monta = (open: boolean) =>
  render(<AthleteZonesDialogHost open={open} atletaId="a1" nomeAtleta="Ana Silva" onClose={vi.fn()} />);

describe('AthleteZonesDialogHost', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fechado não busca as zonas nem renderiza', () => {
    hook({});
    monta(false);
    expect(useAthleteTrainingZones).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('enquanto carrega mostra o carregamento, sem o formulário (nasceria vazio)', () => {
    hook({ zones: null, loading: true });
    monta(true);
    expect(screen.getByRole('status', { name: 'Carregando zonas' })).toBeInTheDocument();
    expect(screen.queryByLabelText('FC de limiar (bpm)')).toBeNull();
  });

  it('GET falho mostra o erro com tentar de novo e não abre o formulário', () => {
    const fetchZones = vi.fn();
    hook({ zones: null, error: new Error('x'), fetchZones });
    monta(true);
    expect(screen.getByText('Não foi possível carregar as zonas do atleta.')).toBeInTheDocument();
    expect(screen.queryByLabelText('FC de limiar (bpm)')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(fetchZones).toHaveBeenCalledTimes(1);
  });

  it('carregado, abre o diálogo com os valores vigentes', () => {
    hook({});
    monta(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('FC de limiar (bpm)')).toHaveValue('168');
  });
});
