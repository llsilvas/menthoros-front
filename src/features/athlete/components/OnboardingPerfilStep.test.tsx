import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingPerfilStep } from './OnboardingPerfilStep';

const ORDEM = ['Garmin', 'Apple Watch', 'Amazfit', 'Coros', 'Samsung Galaxy Watch', 'Polar', 'Suunto', 'Outro'];

describe('OnboardingPerfilStep', () => {
    it('oferece as oito marcas de relógio na ordem de prioridade do founder', () => {
        render(<OnboardingPerfilStep draft={{}} onChange={vi.fn()} />);

        const marcas = screen
            .getAllByRole('radio')
            .map((radio) => radio.textContent ?? '')
            .filter((nome) => ORDEM.includes(nome));

        expect(marcas).toEqual(ORDEM);
    });

    it('escolher Amazfit grava AMAZFIT no rascunho', async () => {
        const onChange = vi.fn();
        render(<OnboardingPerfilStep draft={{}} onChange={onChange} />);

        await userEvent.click(screen.getByRole('radio', { name: 'Amazfit' }));

        expect(onChange).toHaveBeenCalledWith({ dispositivoMarca: 'AMAZFIT' });
    });
});
