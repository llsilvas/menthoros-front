import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreinoEditDialog } from './TreinoEditDialog';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';

vi.mock('../../../hooks/useAthleteTrainingZones');

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
    ],
};

const TREINO: TreinoPlanejadoDto = {
    id: 'treino-1',
    diaSemana: 'TERCA',
    tipoTreino: 'FARTLEK',
    distanciaKm: 8,
    duracaoMin: 'PT45M',
    zonaAlvo: 'Z4',
    percepcaoEsforcoEsperada: 6,
    editadoPeloCoach: false,
    etapas: [
        { ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 10, fcAlvoEtapa: '126-143 bpm', ritmoAlvo: '5:45-6:15/km', alvoPrimario: 'FC' },
        { ordem: 2, tipoEtapa: 'PRINCIPAL', duracaoMin: 30, fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' },
        { ordem: 3, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: '126-143 bpm', alvoPrimario: 'FC' },
    ],
};

describe('TreinoEditDialog — zonas do atleta', () => {
    const onSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: ZONES, loading: false, error: null, fetchZones: vi.fn() });
    });

    const abrir = () => render(<TreinoEditDialog open treino={TREINO} isSaving={false} atletaId="atleta-1" onClose={vi.fn()} onSave={onSave} />);

    it('busca as zonas do atleta recebido', () => {
        abrir();

        expect(useAthleteTrainingZones).toHaveBeenCalledWith('atleta-1');
    });

    it('só a primeira etapa mostra o seletor; as outras viram linha-resumo com zona, pace, FC e relógio', () => {
        abrir();

        expect(screen.getAllByRole('radiogroup', { name: /zona da etapa/i })).toHaveLength(1);
        const resumo = screen.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i });
        expect(resumo).toHaveTextContent('Z2');
        expect(resumo).toHaveTextContent('5:15–5:45');
        expect(resumo).toHaveTextContent('143–150 bpm');
        expect(resumo).toHaveTextContent(/relógio FC/);
    });

    it('clicar na linha-resumo passa o foco para aquela etapa', () => {
        abrir();

        fireEvent.click(screen.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }));

        expect(screen.getAllByRole('radiogroup', { name: /zona da etapa/i })).toHaveLength(1);
        expect(screen.getByRole('radio', { name: 'Z2' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('button', { name: /editar intensidade — tipo da etapa 1/i })).toBeInTheDocument();
    });

    it('zona predominante é exibida, derivada das etapas, e não é um campo editável', () => {
        abrir();

        expect(screen.queryByRole('textbox', { name: /zona predominante/i })).not.toBeInTheDocument();
        expect(screen.getByTestId('zona-predominante')).toBeInTheDocument();
    });

    it('trocar a zona da etapa principal grava ritmo, FC, eixo e a zona do treino no patch', () => {
        abrir();
        fireEvent.click(screen.getByRole('button', { name: /editar intensidade — tipo da etapa 2/i }));

        fireEvent.click(screen.getByRole('radio', { name: 'Z5' }));
        fireEvent.click(screen.getByRole('radio', { name: 'Pace' }));
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        const patch: TreinoPlanejadoPatch = onSave.mock.calls[0][0];
        expect(patch.etapas).toContainEqual(
            expect.objectContaining({ tipoEtapa: 'PRINCIPAL', ritmoAlvo: '4:30-4:45/km', fcAlvoEtapa: '168-178 bpm', alvoPrimario: 'PACE' }),
        );
        expect(patch.zonaAlvo).toBe('Z5');
    });

    it('sem zonas carregadas o editor segue funcionando só com os campos de valor', () => {
        vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: null, loading: false, error: new Error('x'), fetchZones: vi.fn() });
        abrir();

        expect(screen.queryByRole('radiogroup', { name: /zona da etapa/i })).not.toBeInTheDocument();
        expect(within(screen.getByTestId('zona-predominante').parentElement!).getByText(/derivada das etapas/i)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /ritmo/i })).toBeInTheDocument();
    });
});
