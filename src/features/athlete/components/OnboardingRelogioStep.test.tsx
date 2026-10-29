import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingRelogioStep } from './OnboardingRelogioStep';

const config = vi.hoisted(() => ({ garminHabilitado: false }));
vi.mock('../../../config/env', () => ({ runtimeConfig: config }));

const ORDEM = ['Garmin', 'Apple Watch', 'Amazfit', 'Coros', 'Samsung Galaxy Watch', 'Polar', 'Suunto', 'Outro'];

describe('OnboardingRelogioStep', () => {
    beforeEach(() => {
        config.garminHabilitado = false;
    });

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

    describe('canal x marca (CA10)', () => {
        const nomesDosCanais = () =>
            screen
                .getAllByRole('radio')
                .map((r) => r.textContent ?? '')
                .filter((n) => ['intervals.icu', 'Manual', 'Garmin Connect'].includes(n));

        it('flag ligada + Garmin: só o canal GARMIN', () => {
            config.garminHabilitado = true;
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: 'GARMIN', canalIntegracao: 'GARMIN' }} onChange={vi.fn()} />);

            expect(nomesDosCanais()).toEqual(['Garmin Connect']);
        });

        it.each(['COROS', 'APPLE', 'OUTRO'] as const)('flag ligada + %s: nunca oferece GARMIN', (marca) => {
            config.garminHabilitado = true;
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: marca }} onChange={vi.fn()} />);

            expect(nomesDosCanais()).toEqual(['intervals.icu', 'Manual']);
        });

        it('flag desligada + Garmin: comportamento atual (intervals.icu e Manual)', () => {
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: 'GARMIN' }} onChange={vi.fn()} />);

            expect(nomesDosCanais()).toEqual(['intervals.icu', 'Manual']);
        });

        it('flag ligada: escolher Garmin já grava o canal GARMIN', async () => {
            config.garminHabilitado = true;
            const onChange = vi.fn();
            render(<OnboardingRelogioStep draft={{}} onChange={onChange} />);

            await userEvent.click(screen.getByRole('radio', { name: 'Garmin' }));

            expect(onChange).toHaveBeenCalledWith({ dispositivoMarca: 'GARMIN', canalIntegracao: 'GARMIN' });
        });

        it('flag ligada: trocar de Garmin para COROS limpa o canal GARMIN', async () => {
            config.garminHabilitado = true;
            const onChange = vi.fn();
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: 'GARMIN', canalIntegracao: 'GARMIN' }} onChange={onChange} />);

            await userEvent.click(screen.getByRole('radio', { name: 'Coros' }));

            expect(onChange).toHaveBeenCalledWith({ dispositivoMarca: 'COROS', canalIntegracao: undefined });
        });

        it('flag ligada: rascunho carregado com Garmin e sem canal já assume GARMIN', () => {
            config.garminHabilitado = true;
            const onChange = vi.fn();
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: 'GARMIN' }} onChange={onChange} />);

            expect(onChange).toHaveBeenCalledWith({ canalIntegracao: 'GARMIN' });
        });

        it('sem marca, nada é corrigido', () => {
            config.garminHabilitado = true;
            const onChange = vi.fn();
            render(<OnboardingRelogioStep draft={{}} onChange={onChange} />);

            expect(onChange).not.toHaveBeenCalled();
        });

        it('flag ligada: rascunho antigo Garmin + intervals.icu é corrigido para GARMIN', () => {
            config.garminHabilitado = true;
            const onChange = vi.fn();
            render(<OnboardingRelogioStep draft={{ dispositivoMarca: 'GARMIN', canalIntegracao: 'INTERVALS_ICU' }} onChange={onChange} />);

            expect(onChange).toHaveBeenCalledWith({ canalIntegracao: 'GARMIN' });
        });
    });
});
