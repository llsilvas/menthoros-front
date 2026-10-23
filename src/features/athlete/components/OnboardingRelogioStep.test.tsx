import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingRelogioStep } from './OnboardingRelogioStep';

const ORDEM = ['Garmin', 'Apple Watch', 'Amazfit', 'Coros', 'Samsung Galaxy Watch', 'Polar', 'Suunto', 'Outro'];

describe('OnboardingRelogioStep', () => {
    it('oferece as oito marcas de relógio na ordem de prioridade do founder', () => {
        render(<OnboardingRelogioStep draft={{}} onChange={vi.fn()} />);

        const marcas = screen
            .getAllByRole('radio')
            .map((radio) => radio.textContent ?? '')
            .filter((nome) => ORDEM.includes(nome));

        expect(marcas).toEqual(ORDEM);
    });

    it('escolher Amazfit grava AMAZFIT no rascunho', async () => {
        const onChange = vi.fn();
        render(<OnboardingRelogioStep draft={{}} onChange={onChange} />);

        await userEvent.click(screen.getByRole('radio', { name: 'Amazfit' }));

        expect(onChange).toHaveBeenCalledWith({ dispositivoMarca: 'AMAZFIT' });
    });

    it('não oferece Strava como canal (ADR-0003) e explica o que cada canal faz', () => {
        render(<OnboardingRelogioStep draft={{}} onChange={vi.fn()} />);

        expect(screen.getByRole('radio', { name: 'intervals.icu' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Manual' })).toBeInTheDocument();
        expect(screen.queryByText('Strava')).not.toBeInTheDocument();
        expect(screen.getByText(/sincroniza sozinho/i)).toBeInTheDocument();
    });
});
