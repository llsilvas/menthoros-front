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
            expect(screen.getByText('Data do treino')).toBeInTheDocument();
            expect(screen.getByText('Duração (minutos)')).toBeInTheDocument();
            expect(screen.getByText(/Percepção de esforço/)).toBeInTheDocument();
            expect(screen.getByText(/Observações/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Registrar treino/ })).toBeInTheDocument();
        });

        it('exibe chips de tipo de treino', () => {
            renderForm();
            expect(screen.getByText('Corrida contínua')).toBeInTheDocument();
            expect(screen.getByText('Intervalado')).toBeInTheDocument();
            expect(screen.getByText('Regenerativo')).toBeInTheDocument();
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
            renderForm();
            const regChip = screen.getByText('Regenerativo');
            await userEvent.click(regChip);
            expect(screen.queryByText(/Distância/)).not.toBeInTheDocument();
        });

        it('campo distância aparece para tipo CONTINUO', () => {
            renderForm();
            expect(screen.getByText(/Distância/)).toBeInTheDocument();
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

        it('chama onSubmit com dados corretos quando form é válido', async () => {
            renderForm();
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            expect(btn).not.toBeDisabled();
            await userEvent.click(btn);
            expect(onSubmit).toHaveBeenCalledOnce();
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.tipo).toBe('CONTINUO');
            expect(arg.duracaoMinutos).toBe(45);
            expect(arg.percepcaoEsforco).toBe(6);
        });

        it('omite distanciaKm quando campo está vazio', async () => {
            renderForm();
            const btn = screen.getByRole('button', { name: /Registrar treino/ });
            await userEvent.click(btn);
            const arg = onSubmit.mock.calls[0][0];
            expect(arg.distanciaKm).toBeUndefined();
        });
    });

    describe('campo observações', () => {
        it('trunca em 500 caracteres', async () => {
            renderForm();
            const textarea = screen.getByPlaceholderText(/Como foi o treino/);
            const long = 'a'.repeat(600);
            fireEvent.change(textarea, { target: { value: long } });
            expect(screen.getByText('500/500')).toBeInTheDocument();
        });
    });
});
