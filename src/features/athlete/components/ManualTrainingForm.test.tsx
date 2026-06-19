import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualTrainingForm } from './ManualTrainingForm';
import type { TreinoManualInput } from '../../../types/TreinoManual';

describe('ManualTrainingForm', () => {
    const onSubmit = vi.fn((_input: TreinoManualInput): Promise<void> => Promise.resolve());

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderForm(overrides?: Partial<{ loading: boolean; hasTreinoHoje: boolean }>) {
        return render(
            <ManualTrainingForm
                loading={overrides?.loading ?? false}
                hasTreinoHoje={overrides?.hasTreinoHoje ?? false}
                onSubmit={onSubmit}
            />
        );
    }

    describe('renderização', () => {
        it('renderiza todos os campos obrigatórios', () => {
            renderForm();

            expect(screen.getByText('Tipo de treino')).toBeInTheDocument();
            expect(screen.getAllByText('Data do treino').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Duração (minutos)').length).toBeGreaterThan(0);
            expect(screen.getByText(/Percepção de esforço/)).toBeInTheDocument();
            expect(screen.getByText('Observações (opcional)')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Registrar treino/ })).toBeInTheDocument();
        });

        it('exibe chips de tipo de treino', () => {
            renderForm();
            expect(screen.getByText('Corrida contínua')).toBeInTheDocument();
            expect(screen.getByText('Intervalado')).toBeInTheDocument();
            expect(screen.getByText('Regenerativo')).toBeInTheDocument();
        });

        it('chip CONTINUO está marcado como aria-checked=true por padrão', () => {
            renderForm();
            const chip = screen.getByText('Corrida contínua').closest('[role="radio"]');
            expect(chip).toHaveAttribute('aria-checked', 'true');
        });

        it('chip não selecionado tem aria-checked=false', () => {
            renderForm();
            const chip = screen.getByText('Intervalado').closest('[role="radio"]');
            expect(chip).toHaveAttribute('aria-checked', 'false');
        });

        it('grupo de chips tem role="radiogroup"', () => {
            renderForm();
            expect(screen.getByRole('radiogroup', { name: 'Tipo de treino' })).toBeInTheDocument();
        });

        it('exibe warning quando há treino hoje', () => {
            renderForm({ hasTreinoHoje: true });
            expect(screen.getByText(/Você já registrou um treino hoje/)).toBeInTheDocument();
        });

        it('não exibe warning quando não há treino hoje', () => {
            renderForm({ hasTreinoHoje: false });
            expect(screen.queryByText(/Você já registrou um treino hoje/)).not.toBeInTheDocument();
        });

        it('campo distância fica oculto quando tipo é REGENERATIVO', async () => {
            const user = userEvent.setup();
            renderForm();
            await user.click(screen.getByText('Regenerativo'));
            expect(screen.queryByText(/Distância/)).not.toBeInTheDocument();
        });

        it('campo distância aparece para tipo CONTINUO', () => {
            renderForm();
            expect(screen.getByText('Distância (km) — opcional')).toBeInTheDocument();
        });

        it('campo distância aparece para tipo INTERVALADO', async () => {
            const user = userEvent.setup();
            renderForm();
            await user.click(screen.getByText('Intervalado'));
            expect(screen.getByText('Distância (km) — opcional')).toBeInTheDocument();
        });

        it('campo distância aparece para tipo TREINO_LONGO', async () => {
            const user = userEvent.setup();
            renderForm();
            await user.click(screen.getByText('Treino longo'));
            expect(screen.getByText('Distância (km) — opcional')).toBeInTheDocument();
        });
    });

    describe('preview TSS', () => {
        it('exibe estimativa de TSS quando duração e RPE estão preenchidos', () => {
            renderForm();
            // Com duração=45 e RPE=6 (default), TSS = round(0.75 * 0.36 * 100) = 27
            expect(screen.getByText(/TSS \(estimativa\)/)).toBeInTheDocument();
        });
    });

    describe('botão submit', () => {
        it('está desabilitado quando loading=true', () => {
            renderForm({ loading: true });
            expect(screen.getByRole('button', { name: /Registrando/ })).toBeDisabled();
        });

        it('está desabilitado quando duracaoMinutos está vazio', async () => {
            const user = userEvent.setup();
            renderForm();
            const input = screen.getByLabelText(/Duração/i);
            await user.clear(input);
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            expect(btn).toBeDisabled();
        });

        it('está desabilitado quando duracaoMinutos excede 600', async () => {
            const user = userEvent.setup();
            renderForm();
            const input = screen.getByLabelText(/Duração/i);
            await user.clear(input);
            await user.type(input, '601');
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            expect(btn).toBeDisabled();
        });

        it('chama onSubmit com dados corretos quando form é válido', async () => {
            const user = userEvent.setup();
            renderForm();
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            expect(btn).not.toBeDisabled();
            await user.click(btn);
            expect(onSubmit).toHaveBeenCalledOnce();
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.tipo).toBe('CONTINUO');
            expect(arg.duracaoMinutos).toBe(45);
            expect(arg.percepcaoEsforco).toBe(6);
        });

        it('omite distanciaKm quando campo está vazio', async () => {
            const user = userEvent.setup();
            renderForm();
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            await user.click(btn);
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.distanciaKm).toBeUndefined();
        });

        it('omite distanciaKm quando valor é zero', async () => {
            const user = userEvent.setup();
            renderForm();
            const distInput = screen.getByLabelText('Distância (km)');
            await user.clear(distInput);
            await user.type(distInput, '0');
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            await user.click(btn);
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.distanciaKm).toBeUndefined();
        });

        it('inclui distanciaKm quando valor é positivo', async () => {
            const user = userEvent.setup();
            renderForm();
            const distInput = screen.getByLabelText('Distância (km)');
            await user.clear(distInput);
            await user.type(distInput, '10');
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            await user.click(btn);
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.distanciaKm).toBe(10);
        });

        it('reseta tipo para CONTINUO após submit bem-sucedido', async () => {
            const user = userEvent.setup();
            renderForm();
            await user.click(screen.getByText('Intervalado'));
            const intervChip = screen.getByText('Intervalado').closest('[role="radio"]');
            expect(intervChip).toHaveAttribute('aria-checked', 'true');
            await user.click(screen.getByRole('button', { name: /Registrar treino/ }));
            const continuoChip = screen.getByText('Corrida contínua').closest('[role="radio"]');
            expect(continuoChip).toHaveAttribute('aria-checked', 'true');
        });

        it('altera aria-checked ao trocar tipo', async () => {
            const user = userEvent.setup();
            renderForm();
            await user.click(screen.getByText('Fartlek'));
            const fartlekChip = screen.getByText('Fartlek').closest('[role="radio"]');
            const continuoChip = screen.getByText('Corrida contínua').closest('[role="radio"]');
            expect(fartlekChip).toHaveAttribute('aria-checked', 'true');
            expect(continuoChip).toHaveAttribute('aria-checked', 'false');
        });
    });

    describe('campo observações', () => {
        it('trunca em 500 caracteres', () => {
            renderForm();
            const textarea = screen.getByPlaceholderText(/Como foi o treino/);
            const long = 'a'.repeat(600);
            // fireEvent.change simula mutação programática sem passar pelas camadas de userEvent
            fireEvent.change(textarea, { target: { value: long } });
            expect(screen.getByText('500/500')).toBeInTheDocument();
        });
    });
});
