import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreinoEditDialog } from './TreinoEditDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';

const TREINO: TreinoPlanejadoDto = {
    id: 'treino-1',
    diaSemana: 'SEGUNDA',
    tipoTreino: 'FACIL',
    distanciaKm: 10,
    duracaoMin: 'PT60M',
    zonaAlvo: 'Z2',
    percepcaoEsforcoEsperada: 6,
    tssPlanejado: 55,
    observacao: 'Observação inicial',
    editadoPeloCoach: false,
};

describe('TreinoEditDialog', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    it('exibe os campos pré-preenchidos com valores atuais do treino', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}

                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // distanciaKm
        expect(screen.getByDisplayValue('60')).toBeInTheDocument(); // duracaoMin em minutos
        expect(screen.getByDisplayValue('Z2')).toBeInTheDocument(); // zonaAlvo
        expect(screen.getByDisplayValue('6')).toBeInTheDocument();  // rpe
        expect(screen.getByDisplayValue('55')).toBeInTheDocument(); // tss
        expect(screen.getByDisplayValue('Observação inicial')).toBeInTheDocument();
    });

    it('botão Salvar chama onSave com patch correto incluindo duração ISO-8601', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}

                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        const distInput = screen.getByDisplayValue('10');
        fireEvent.change(distInput, { target: { value: '15' } });

        const durInput = screen.getByDisplayValue('60');
        fireEvent.change(durInput, { target: { value: '90' } });

        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        expect(onSave).toHaveBeenCalledOnce();
        const patch: TreinoPlanejadoPatch = onSave.mock.calls[0][0];
        expect(patch.distanciaKm).toBe(15);
        expect(patch.duracaoMin).toBe('PT90M'); // convertido de volta para ISO-8601
    });

    it('botão Cancelar chama onClose sem chamar onSave', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}

                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('botão Salvar fica desabilitado durante isSaving', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}

                isSaving
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
    });

    it('Salvar sem alterações chama onClose sem chamar onSave', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('exibe blocos Aquecimento, Treino e Desaquecimento para treino simples', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.getByText('Aquecimento')).toBeInTheDocument();
        expect(screen.getByText('Treino')).toBeInTheDocument();
        expect(screen.getByText('Desaquecimento')).toBeInTheDocument();
    });

    it('não exibe campos quando open=false', () => {
        render(
            <TreinoEditDialog
                open={false}
                treino={TREINO}

                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument();
    });
});

// ── Modo intervalado ──────────────────────────────────────────────────────────

describe('TreinoEditDialog — modo intervalado', () => {
    const onClose = vi.fn();
    const onSave  = vi.fn();

    const TREINO_INTERVALADO: TreinoPlanejadoDto = {
        id: 'treino-2',
        diaSemana: 'TERCA',
        tipoTreino: 'INTERVALADO',
        distanciaKm: 8,
        duracaoMin: 'PT50M',
        zonaAlvo: 'Z4',
        percepcaoEsforcoEsperada: 8,
        tssPlanejado: 90,
        editadoPeloCoach: false,
    };

    beforeEach(() => vi.clearAllMocks());

    it('exibe container de série com blocos Esforço e Recuperação', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO_INTERVALADO}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.getByText(/Série/i)).toBeInTheDocument();
        expect(screen.getByText('Esforço')).toBeInTheDocument();
        expect(screen.getByText('Recuperação')).toBeInTheDocument();
        expect(screen.getByLabelText(/Diminuir repetições/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Aumentar repetições/i)).toBeInTheDocument();
    });

    it('stepper incrementa e decrementa repetições dentro do limite 1–20', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO_INTERVALADO}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        const btnMenos = screen.getByLabelText(/Diminuir repetições/i);
        const btnMais  = screen.getByLabelText(/Aumentar repetições/i);

        expect(btnMenos).toBeDisabled();

        fireEvent.click(btnMais);
        fireEvent.click(btnMais);
        expect(screen.getByText('3×')).toBeInTheDocument();

        fireEvent.click(btnMenos);
        expect(screen.getByText('2×')).toBeInTheDocument();
    });

    it('exibe blocos Aquecimento e Desaquecimento sempre presentes', () => {
        render(
            <TreinoEditDialog
                open
                treino={TREINO_INTERVALADO}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        expect(screen.getByText('Aquecimento')).toBeInTheDocument();
        expect(screen.getByText('Desaquecimento')).toBeInTheDocument();
    });
});
