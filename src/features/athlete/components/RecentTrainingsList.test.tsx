import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentTrainingsList } from './RecentTrainingsList';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';

const TREINO: TreinoRealizadoDto = {
    id: 't1', dataTreino: '2026-11-04', tipoTreino: 'CONTINUO', duracaoMin: '00:45:00', distanciaKm: 8,
    fonteDados: { value: 'GARMIN', label: 'Garmin Connect' },
    status: { value: 'REALIZADO', label: 'Realizado' },
};

describe('RecentTrainingsList', () => {
    it('treino do Garmin mostra o modelo do dispositivo no selo de fonte (CA8)', () => {
        render(<RecentTrainingsList treinos={[{ ...TREINO, deviceName: 'Forerunner 970' }]} />);
        expect(screen.getByText('Garmin Forerunner 970')).toBeInTheDocument();
    });

    it('Garmin sem modelo mostra só "Garmin"; outra fonte mantém o rótulo dela', () => {
        render(<RecentTrainingsList treinos={[
            { ...TREINO, deviceName: 'unknown' },
            { ...TREINO, id: 't2', fonteDados: { value: 'STRAVA', label: 'Strava' } },
        ]} />);
        expect(screen.getByText('Garmin')).toBeInTheDocument();
        expect(screen.getByText('Strava')).toBeInTheDocument();
    });
});
