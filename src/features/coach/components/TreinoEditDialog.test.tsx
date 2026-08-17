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
        expect(screen.getByTestId('repeticoes-display')).toHaveTextContent('3×');

        fireEvent.click(btnMenos);
        expect(screen.getByTestId('repeticoes-display')).toHaveTextContent('2×');
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

    it('timeline desenha uma barra por repetição, não um bloco agregado', () => {
        // Fartlek já expandido pelo backend: 4 pares esforço/recuperação. A timeline da revisão
        // agregava tudo em um bloco rotulado "4×", escondendo a estrutura justamente na tela onde
        // o treinador decide se ela está certa. Deve ler igual ao DetalheTreinoDialog.
        // Durações escolhidas para que cada barra passe do limiar `widthPct > 5` do
        // WorkoutTimelineChart — abaixo dele a barra é desenhada sem rótulo, e o teste não
        // conseguiria distinguir "expandiu" de "agregou".
        const fartlek: TreinoPlanejadoDto = {
            ...TREINO_INTERVALADO,
            tipoTreino: 'FARTLEK',
            etapas: [
                { ordem: 1, tipoEtapa: 'AQUECIMENTO',   duracaoMin: 5, fcAlvoEtapa: 'Z2' },
                { ordem: 2, tipoEtapa: 'INTERVALADO',   duracaoMin: 3, fcAlvoEtapa: 'Z4' },
                { ordem: 3, tipoEtapa: 'RECUPERACAO',   duracaoMin: 2, fcAlvoEtapa: 'Z1' },
                { ordem: 4, tipoEtapa: 'INTERVALADO',   duracaoMin: 3, fcAlvoEtapa: 'Z4' },
                { ordem: 5, tipoEtapa: 'RECUPERACAO',   duracaoMin: 2, fcAlvoEtapa: 'Z1' },
                { ordem: 6, tipoEtapa: 'INTERVALADO',   duracaoMin: 3, fcAlvoEtapa: 'Z4' },
                { ordem: 7, tipoEtapa: 'RECUPERACAO',   duracaoMin: 2, fcAlvoEtapa: 'Z1' },
                { ordem: 8, tipoEtapa: 'INTERVALADO',   duracaoMin: 3, fcAlvoEtapa: 'Z4' },
                { ordem: 9, tipoEtapa: 'RECUPERACAO',   duracaoMin: 2, fcAlvoEtapa: 'Z1' },
                { ordem: 10, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5, fcAlvoEtapa: 'Z1' },
            ],
        };

        render(
            <TreinoEditDialog
                open
                treino={fartlek}
                isSaving={false}
                onClose={onClose}
                onSave={onSave}
            />,
        );

        // Uma barra por repetição, numerada, alternando com a recuperação. O "4×" do stepper da
        // série continua existindo e é legítimo — o que não pode voltar é a barra única de
        // esforço somando as 4 repetições.
        ['1/4', '2/4', '3/4', '4/4'].forEach(label =>
            expect(screen.getByText(label)).toBeInTheDocument(),
        );
        expect(screen.getAllByText('REC')).toHaveLength(4);
        // duração por barra é a de UMA repetição (3 min), não o agregado (12 min)
        expect(screen.getAllByText('3 min')).toHaveLength(4);
    });

    it.each(['TIRO', 'SUBIDA'] as const)(
        'exibe container de série para tipoTreino=%s (fisiologicamente intervalado)',
        (tipoTreino) => {
            render(
                <TreinoEditDialog
                    open
                    treino={{ ...TREINO_INTERVALADO, tipoTreino }}
                    isSaving={false}
                    onClose={onClose}
                    onSave={onSave}
                />,
            );

            expect(screen.getByText(/Série/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Diminuir repetições/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Aumentar repetições/i)).toBeInTheDocument();
        },
    );
});
