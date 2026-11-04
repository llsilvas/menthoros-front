import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../api/core/ApiError';
import { CoachAthleteZonesService } from '../../../api/services/CoachAthleteZonesService';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { AthleteZonesDialog } from './AthleteZonesDialog';

vi.mock('../../../api/services/CoachAthleteZonesService');

const LIMIAR: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false, dataUltimoTesteFc: '2026-10-12', dataUltimoTestePace: '2026-10-12' },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 186, estimada: false },
    disponibilidade: { pace: true, fc: true },
    modos: { fc: 'LIMIAR', pace: 'LIMIAR' },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
        { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
        { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, motivoFc: 'FC_NAO_ESTABILIZA' },
    ],
};

/** Ritmo gravado em manual: faixa efetiva 5 s mais lenta, a do limiar ao lado. */
const PACE_MANUAL: AthleteTrainingZonesDto = {
    ...LIMIAR,
    modos: { fc: 'LIMIAR', pace: 'MANUAL' },
    zonas: LIMIAR.zonas.map((z) => ({
        ...z,
        pacePeloLimiar: z.pace,
        pace: z.pace ? { minSegKm: z.pace.minSegKm + 5, maxSegKm: z.pace.maxSegKm + 5 } : null,
    })),
};

function abre(props: Partial<ComponentProps<typeof AthleteZonesDialog>> = {}) {
    const onClose = vi.fn();
    render(<AthleteZonesDialog open onClose={onClose} atletaId="a1" nomeAtleta="Maria" zonas={LIMIAR} {...props} />);
    return { onClose };
}

const salvar = () => screen.getByRole('button', { name: 'Salvar zonas' });

describe('AthleteZonesDialog — modo manual', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(CoachAthleteZonesService.simular).mockResolvedValue(LIMIAR);
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockResolvedValue(LIMIAR);
        vi.mocked(CoachAthleteZonesService.salvarZonasManuais).mockResolvedValue(LIMIAR);
    });

    it('a aba mostra o modo de cada eixo e começa em "Calcular pelo limiar"', () => {
        abre({ zonas: PACE_MANUAL });

        expect(screen.getByTestId('modo-fc')).toHaveTextContent('Pelo limiar');
        expect(screen.getByTestId('modo-pace')).toHaveTextContent('Manual');
        expect(screen.getByRole('button', { name: /Calcular pelo limiar/, pressed: true })).toBeInTheDocument();
    });

    it('informar manualmente abre De/Até editáveis pré-preenchidos com o cálculo', async () => {
        abre();
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));

        expect(screen.getByRole('textbox', { name: 'Z2 De' })).toHaveValue('143');
        expect(screen.getByRole('textbox', { name: 'Z2 Até' })).toHaveValue('150');
        expect(screen.queryByRole('textbox', { name: 'Z6 De' })).toBeNull();
    });

    it('CA3: faixa sobreposta marca a linha com aria-invalid e texto, e bloqueia salvar', async () => {
        abre();
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        const z3De = screen.getByRole('textbox', { name: 'Z3 De' });
        await userEvent.clear(z3De);
        await userEvent.type(z3De, '148');

        expect(z3De).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Z3 começa dentro da Z2')).toBeInTheDocument();
        expect(salvar()).toBeDisabled();
    });

    it('salvar faixas de FC manuais chama só o PUT de manuais, com as faixas em ordem', async () => {
        abre();
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        const z2De = screen.getByRole('textbox', { name: 'Z2 De' });
        await userEvent.clear(z2De);
        await userEvent.type(z2De, '145');
        await userEvent.click(salvar());

        await waitFor(() => expect(CoachAthleteZonesService.salvarZonasManuais).toHaveBeenCalledTimes(1));
        const [, corpo] = vi.mocked(CoachAthleteZonesService.salvarZonasManuais).mock.calls[0];
        expect(corpo.pace).toBeUndefined();
        expect(corpo.fc?.modo).toBe('MANUAL');
        expect(corpo.fc?.faixas?.[1]).toEqual({ zona: 2, min: 145, max: 150 });
        expect(CoachAthleteZonesService.salvarAncoras).not.toHaveBeenCalled();
    });

    it('ritmo manual gravado: tabela com a faixa manual em m:ss', () => {
        abre({ zonas: PACE_MANUAL, abaInicial: 'pace' });

        expect(screen.getByRole('button', { name: /Informar manualmente/, pressed: true })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Z2 De' })).toHaveValue('5:20');
    });

    it('Recalcular a partir do limiar pede confirmação e repõe a faixa do limiar', async () => {
        abre({ zonas: PACE_MANUAL, abaInicial: 'pace' });
        await userEvent.click(screen.getByRole('button', { name: 'Recalcular a partir do limiar' }));
        const confirma = await screen.findByRole('dialog', { name: /Recalcular/ });
        await userEvent.click(within(confirma).getByRole('button', { name: 'Recalcular' }));

        expect(await screen.findByRole('textbox', { name: 'Z2 De' })).toHaveValue('5:15');
    });

    it('sem pace de limiar, Recalcular fica indisponível no ritmo', () => {
        const semLimiar: AthleteTrainingZonesDto = {
            ...PACE_MANUAL,
            ancoras: { ...PACE_MANUAL.ancoras, paceLimiarMinKm: null },
            zonas: PACE_MANUAL.zonas.map((z) => ({ ...z, pacePeloLimiar: null })),
        };
        abre({ zonas: semLimiar, abaInicial: 'pace' });

        expect(screen.getByRole('button', { name: 'Recalcular a partir do limiar' })).toBeDisabled();
        expect(screen.getByText('Sem pace de limiar')).toBeInTheDocument();
    });

    it('Q1: voltar o ritmo gravado em manual para o limiar pede confirmação e envia LIMIAR', async () => {
        abre({ zonas: PACE_MANUAL, abaInicial: 'pace' });
        await userEvent.click(screen.getByRole('button', { name: /Calcular pelo limiar/ }));
        const confirma = await screen.findByRole('dialog', { name: /Voltar ao cálculo pelo limiar/ });
        expect(confirma).toHaveTextContent(/apagadas/);
        await userEvent.click(within(confirma).getByRole('button', { name: 'Voltar ao limiar' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Salvar zonas' }));

        await waitFor(() => expect(CoachAthleteZonesService.salvarZonasManuais).toHaveBeenCalledWith('a1', { pace: { modo: 'LIMIAR' } }));
    });

    it('limiar alterado com o eixo em manual avisa que as faixas manuais continuam valendo', async () => {
        abre({ zonas: PACE_MANUAL, abaInicial: 'pace' });
        const limiar = screen.getByLabelText('Ritmo de limiar (m:ss /km)');
        await userEvent.clear(limiar);
        await userEvent.type(limiar, '4:50');

        expect(screen.getByText(/faixas manuais de ritmo continuam valendo/)).toBeInTheDocument();
    });

    it('falha só no PUT das faixas: avisa que os limiares foram salvos e o retry reenvia só as faixas', async () => {
        vi.mocked(CoachAthleteZonesService.salvarZonasManuais)
            .mockRejectedValueOnce(new ApiError({ method: 'PUT', url: '' }, { url: '', ok: false, status: 500, statusText: '', body: {} }, 'x'));
        const { onClose } = abre();
        const limiar = screen.getByLabelText('FC de limiar (bpm)');
        await userEvent.clear(limiar);
        await userEvent.type(limiar, '170');
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        await userEvent.click(salvar());

        expect(await screen.findByText(/Limiares salvos; faixas manuais não/)).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();

        await userEvent.click(salvar());
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(CoachAthleteZonesService.salvarAncoras).toHaveBeenCalledTimes(1);
        expect(CoachAthleteZonesService.salvarZonasManuais).toHaveBeenCalledTimes(2);
    });

    it('FC manual acima da máxima real avisa que não vai ao relógio', async () => {
        abre();
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        const z5Ate = screen.getByRole('textbox', { name: 'Z5 Até' });
        await userEvent.clear(z5Ate);
        await userEvent.type(z5Ate, '195');

        expect(screen.getByText(/acima da FC máxima \(186 bpm\)/)).toBeInTheDocument();
    });

    it('FC manual acima da máxima estimada também avisa: o push usa a máxima com fallback', async () => {
        abre({ zonas: { ...LIMIAR, fcMaxima: { bpm: 188, estimada: true } } });
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        const z5Ate = screen.getByRole('textbox', { name: 'Z5 Até' });
        await userEvent.clear(z5Ate);
        await userEvent.type(z5Ate, '195');

        expect(screen.getByText(/acima da FC máxima \(188 bpm\)/)).toBeInTheDocument();
    });

    it('máxima digitada no formulário vale para o aviso', async () => {
        abre({ zonas: { ...LIMIAR, fcMaxima: { bpm: 188, estimada: true } } });
        const maxima = screen.getByLabelText('FC máxima (bpm)');
        await userEvent.clear(maxima);
        await userEvent.type(maxima, '200');
        await userEvent.click(screen.getByRole('button', { name: /Informar manualmente/ }));
        const z5Ate = screen.getByRole('textbox', { name: 'Z5 Até' });
        await userEvent.clear(z5Ate);
        await userEvent.type(z5Ate, '195');

        expect(screen.queryByText(/Faixas acima da FC máxima/)).toBeNull();
    });

    it('limiar alterado: Recalcular espera a prévia do limiar novo e usa ela, não a faixa antiga', async () => {
        let resolver: (z: AthleteTrainingZonesDto) => void = () => undefined;
        vi.mocked(CoachAthleteZonesService.simular).mockReturnValue(
            new Promise<AthleteTrainingZonesDto>((r) => { resolver = r; }) as ReturnType<typeof CoachAthleteZonesService.simular>,
        );
        abre({ zonas: PACE_MANUAL, abaInicial: 'pace' });
        const limiar = screen.getByLabelText('Ritmo de limiar (m:ss /km)');
        await userEvent.clear(limiar);
        await userEvent.type(limiar, '4:50');

        const recalcular = screen.getByRole('button', { name: 'Recalcular a partir do limiar' });
        expect(recalcular).toBeDisabled();
        expect(screen.getByText('Calculando a prévia…')).toBeInTheDocument();

        await waitFor(() => expect(CoachAthleteZonesService.simular).toHaveBeenCalled());
        resolver({
            ...PACE_MANUAL,
            zonas: PACE_MANUAL.zonas.map((z) => ({ ...z, pacePeloLimiar: { minSegKm: 300, maxSegKm: 330 } })),
        });
        await waitFor(() => expect(recalcular).toBeEnabled());
        await userEvent.click(recalcular);
        const confirma = await screen.findByRole('dialog', { name: /Recalcular/ });
        await userEvent.click(within(confirma).getByRole('button', { name: 'Recalcular' }));

        expect(await screen.findByRole('textbox', { name: 'Z2 De' })).toHaveValue('5:00');
    });
});
