import { render, screen } from '@testing-library/react';
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

  it('enquanto carrega não abre o diálogo (o formulário nasceria vazio)', () => {
    hook({ zones: null, loading: true });
    monta(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('carregado, abre o diálogo com os valores vigentes', () => {
    hook({});
    monta(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('FC de limiar (bpm)')).toHaveValue('168');
  });
});
