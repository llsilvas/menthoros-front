import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanoDetalhePanel } from './PlanoDetalhePanel';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import type { PlanoSemanalDto } from '../../../types/PlanoReview';

vi.mock('../../../hooks/useAthleteTrainingZones');

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [{ numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } }],
};

const PLANO: PlanoSemanalDto = {
    id: 'plano-1',
    atletaId: 'atleta-1',
    semanaInicio: '2026-09-07',
    semanaFim: '2026-09-13',
    volumePlanejadoKm: 45,
    volumeRealizadoKm: 0,
    volumeAlvoKm: 45,
    status: 'PLANEJADO',
    reviewStatus: 'AGUARDANDO_REVISAO',
    treinosPlanejados: [
        {
            id: 't1',
            diaSemana: 'SEGUNDA',
            tipoTreino: 'FACIL',
            distanciaKm: 10,
            etapas: [{ tipoEtapa: 'PRINCIPAL', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }],
        },
    ],
};

function mockHook(over: Partial<ReturnType<typeof useAthleteTrainingZones>>) {
    vi.mocked(useAthleteTrainingZones).mockReturnValue({
        zones: ZONES,
        loading: false,
        error: null,
        fetchZones: vi.fn(),
        ...over,
    });
}

const renderPanel = () =>
    render(<PlanoDetalhePanel plano={PLANO} isActing={false} onAprovar={vi.fn()} onRejeitar={vi.fn()} />);

describe('PlanoDetalhePanel — zonas do atleta', () => {
    beforeEach(() => vi.clearAllMocks());

    it('busca as zonas do atleta dono do plano', () => {
        mockHook({});
        renderPanel();

        expect(useAthleteTrainingZones).toHaveBeenCalledWith('atleta-1');
    });

    it('mostra a seção "Zonas do atleta" recolhida e o card com Zn · pace · FC', () => {
        mockHook({});
        renderPanel();

        expect(screen.getByRole('button', { name: /zonas do atleta/i })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByTestId('linha-intensidade').textContent).toMatch(/Z2.*5:15–5:45.*143–150 bpm/);
    });

    it('enquanto carrega, mostra o skeleton das zonas; o plano continua visível', () => {
        mockHook({ zones: null, loading: true });
        renderPanel();

        expect(screen.getByRole('status', { name: /carregando zonas/i })).toBeInTheDocument();
        expect(screen.getByTestId('tag-treino-t1')).toBeInTheDocument();
    });

    it('com erro nas zonas avisa e não bloqueia a revisão', () => {
        mockHook({ zones: null, error: new Error('falhou') });
        renderPanel();

        expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar as zonas/i);
        expect(screen.getByTestId('tag-treino-t1')).toBeInTheDocument();
    });

    it('sem zonas, o card mostra os valores da etapa sem chip de zona', () => {
        mockHook({ zones: null });
        renderPanel();

        expect(screen.getByTestId('linha-intensidade').textContent).toMatch(/5:15–5:45.*143–150 bpm/);
        expect(screen.queryByTestId('chip-zona')).not.toBeInTheDocument();
    });
});
