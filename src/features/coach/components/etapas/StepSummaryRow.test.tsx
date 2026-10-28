import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepSummaryRow } from './StepSummaryRow';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
    ],
};

describe('StepSummaryRow', () => {
    it('faixa dentro de Z1 sem casar a zona inteira mostra Z1 como aproximada, pace com /km e a ação Editar', () => {
        render(
            <StepSummaryRow
                intensidade={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '130-136 bpm', ritmoAlvo: '6:00-6:10/km', alvoPrimario: 'FC' }}
                zones={ZONES}
                tipoEtapa="AQUECIMENTO"
                onAbrir={vi.fn()}
                rotulo="etapa 1"
            />,
        );

        const linha = screen.getByRole('button', { name: /editar intensidade — etapa 1/i });
        expect(screen.getByTestId('zona-aproximada')).toHaveTextContent('Z1');
        expect(linha).toHaveTextContent('6:00–6:10 /km');
        expect(linha).toHaveTextContent('Editar');
    });

    it('zona escolhida no seletor aparece como exata', () => {
        render(
            <StepSummaryRow
                intensidade={{ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }}
                zones={ZONES}
                tipoEtapa="PRINCIPAL"
                onAbrir={vi.fn()}
                rotulo="etapa 2"
            />,
        );

        expect(screen.getByTestId('zona-exata')).toHaveTextContent('Z2');
        expect(screen.queryByTestId('zona-aproximada')).toBeNull();
    });
});
