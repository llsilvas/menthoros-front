import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalibrationExtrasFields } from './CalibrationExtrasFields';
import { CALIBRACAO_EXTRAS_DEFAULT } from '../../../types/TreinoManual';

describe('CalibrationExtrasFields', () => {
    it('renderiza os 4 sliders com os valores atuais', () => {
        render(<CalibrationExtrasFields value={CALIBRACAO_EXTRAS_DEFAULT} onChange={vi.fn()} />);

        expect(screen.getByRole('slider', { name: 'Nível de dor' })).toHaveAttribute('aria-valuenow', '1');
        expect(screen.getByRole('slider', { name: 'Nível de fadiga' })).toHaveAttribute('aria-valuenow', '5');
        expect(screen.getByRole('slider', { name: 'Qualidade do sono (noite anterior)' })).toHaveAttribute('aria-valuenow', '5');
        expect(screen.getByRole('slider', { name: 'Nível de recuperação' })).toHaveAttribute('aria-valuenow', '5');
    });

    it('mostra a mensagem explicando por que os campos extras aparecem', () => {
        render(<CalibrationExtrasFields value={CALIBRACAO_EXTRAS_DEFAULT} onChange={vi.fn()} />);

        expect(screen.getByText(/fase de calibração/i)).toBeInTheDocument();
    });

    it('chama onChange com o patch do campo ajustado', () => {
        const onChange = vi.fn();
        render(<CalibrationExtrasFields value={CALIBRACAO_EXTRAS_DEFAULT} onChange={onChange} />);

        const slider = screen.getByRole('slider', { name: 'Nível de dor' });
        act(() => { slider.focus(); });
        fireEvent.keyDown(slider, { key: 'ArrowRight' });

        expect(onChange).toHaveBeenCalledWith({ nivelDor: 2 });
    });
});
