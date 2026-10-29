import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentWeekPlan } from './CurrentWeekPlan';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import type { PlanoVigenteDto } from '../../../types/AtletaPerfilCoach';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

vi.mock('../../../hooks/useAthleteTrainingZones');
vi.mock('../../../hooks/useTreinoPlanejado');

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [{ numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } }],
};

const PLANO: PlanoVigenteDto = {
    planoId: 'plano-1',
    semanaInicio: '2026-06-23',
    semanaFim: '2026-06-29',
    reviewStatus: 'APROVADO',
    treinos: [
        {
            id: 't1',
            diaSemana: 'SEGUNDA',
            tipoTreino: 'FACIL',
            distanciaKm: 10,
            statusExecucao: 'PENDENTE',
            etapas: [{ tipoEtapa: 'PRINCIPAL', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'PACE' }],
        },
    ],
};

describe('CurrentWeekPlan — zonas do atleta', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useTreinoPlanejado).mockReturnValue({
            isSaving: false, isDeleting: false, saveError: null, deleteError: null,
            editarTreino: vi.fn(), adicionarTreino: vi.fn(), excluirTreino: vi.fn(),
        });
        vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: ZONES, loading: false, error: null, fetchZones: vi.fn() });
    });

    it('busca as zonas do atleta e o card mostra Zn · pace · FC', () => {
        render(<CurrentWeekPlan plano={PLANO} atletaId="atleta-1" onGerarPlano={vi.fn()} onRevisarPlano={vi.fn()} />);

        expect(useAthleteTrainingZones).toHaveBeenCalledWith('atleta-1');
        expect(screen.getByTestId('linha-intensidade').textContent).toMatch(/Z2.*5:15–5:45.*143–150 bpm/);
    });
});
