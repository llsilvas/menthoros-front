import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CalibrationBanner } from './CalibrationBanner';
import type { CalibrationStatus } from '../../../types/Calibracao';

function status(overrides: Partial<CalibrationStatus> = {}): CalibrationStatus {
    return { phase: 'CALIBRATION', stage: 'OBSERVATION', weekNumber: 1, confidenceScore: 20, ...overrides };
}

describe('CalibrationBanner', () => {
    it('não renderiza nada quando status é null e o atleta não acabou de sair', () => {
        const { container } = render(<CalibrationBanner status={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('mostra a semana atual e a mensagem do estágio OBSERVATION', () => {
        render(<CalibrationBanner status={status({ stage: 'OBSERVATION', weekNumber: 1 })} />);

        expect(screen.getByText('Semana 1 de calibração')).toBeInTheDocument();
        expect(screen.getByText(/observando seus primeiros treinos/i)).toBeInTheDocument();
    });

    it('mostra a mensagem do estágio CALIBRATION', () => {
        render(<CalibrationBanner status={status({ stage: 'CALIBRATION', weekNumber: 2 })} />);

        expect(screen.getByText('Semana 2 de calibração')).toBeInTheDocument();
        expect(screen.getByText(/ajustando seu plano/i)).toBeInTheDocument();
    });

    it('mostra a mensagem do estágio STABILIZATION', () => {
        render(<CalibrationBanner status={status({ stage: 'STABILIZATION', weekNumber: 3 })} />);

        expect(screen.getByText('Semana 3 de calibração')).toBeInTheDocument();
        expect(screen.getByText(/estabilizando seu plano/i)).toBeInTheDocument();
    });

    it('aciona onDismiss ao fechar o banner informativo', async () => {
        const onDismiss = vi.fn();
        render(<CalibrationBanner status={status()} onDismiss={onDismiss} />);

        await userEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(onDismiss).toHaveBeenCalled();
    });

    it('mostra o banner de saída (task 8.5) quando justExited é true, mesmo com status null', () => {
        render(<CalibrationBanner status={null} justExited />);

        expect(screen.getByText(/calibração concluída/i)).toBeInTheDocument();
        expect(screen.getByText(/reflete seu histórico real/i)).toBeInTheDocument();
    });

    it('prioriza o banner de saída sobre o informativo quando ambos poderiam se aplicar', () => {
        render(<CalibrationBanner status={status()} justExited />);

        expect(screen.getByText(/calibração concluída/i)).toBeInTheDocument();
        expect(screen.queryByText(/semana 1 de calibração/i)).toBeNull();
    });

    it('aciona onDismiss ao fechar o banner de saída', async () => {
        const onDismiss = vi.fn();
        render(<CalibrationBanner status={null} justExited onDismiss={onDismiss} />);

        await userEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(onDismiss).toHaveBeenCalled();
    });
});
