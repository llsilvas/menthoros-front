import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreinoEditDialog } from './TreinoEditDialog';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch, EtapaTreinoDto } from '../../../types/PlanoReview';

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

const etapa = (ordem: number, tipoEtapa: string, duracaoMin: number, fcAlvoEtapa?: string): EtapaTreinoDto =>
    ({ ordem, tipoEtapa, duracaoMin, fcAlvoEtapa });

describe('TreinoEditDialog', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    const renderDialog = (treino: TreinoPlanejadoDto = TREINO, isSaving = false) =>
        render(
            <TreinoEditDialog open treino={treino} isSaving={isSaving} onClose={onClose} onSave={onSave} />,
        );

    beforeEach(() => vi.clearAllMocks());

    it('exibe os campos globais pré-preenchidos com valores atuais do treino', () => {
        renderDialog();

        expect(screen.getByDisplayValue('6')).toBeInTheDocument();  // RPE
        expect(screen.getByDisplayValue('55')).toBeInTheDocument(); // TSS
        expect(screen.getByDisplayValue('Observação inicial')).toBeInTheDocument();
    });

    it('treino sem etapas detalhadas vira uma etapa PRINCIPAL editável', () => {
        // Sem isso o dialog abriria vazio para treinos que só têm distância/duração no nível do
        // treino — não haveria o que editar.
        renderDialog();

        expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // distanciaKm
        expect(screen.getByDisplayValue('60')).toBeInTheDocument(); // duracaoMin em minutos
        expect(screen.getByText('PRINCIPAL')).toBeInTheDocument();
    });

    it('botão Salvar chama onSave com patch correto incluindo duração ISO-8601', () => {
        renderDialog();

        fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '15' } });
        fireEvent.change(screen.getByDisplayValue('60'), { target: { value: '90' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        expect(onSave).toHaveBeenCalledOnce();
        const patch: TreinoPlanejadoPatch = onSave.mock.calls[0][0];
        expect(patch.distanciaKm).toBe(15);
        expect(patch.duracaoMin).toBe('PT90M');
    });

    it('botão Cancelar chama onClose sem chamar onSave', () => {
        renderDialog();

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('botão Salvar fica desabilitado durante isSaving', () => {
        renderDialog(TREINO, true);

        expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
    });

    it('Salvar sem alterações chama onClose sem chamar onSave', () => {
        renderDialog();

        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        expect(onClose).toHaveBeenCalledOnce();
        expect(onSave).not.toHaveBeenCalled();
    });

    it('não exibe campos quando open=false', () => {
        render(
            <TreinoEditDialog open={false} treino={TREINO} isSaving={false} onClose={onClose} onSave={onSave} />,
        );

        expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument();
    });

    it('permite adicionar etapa e série à lista', () => {
        renderDialog();

        fireEvent.click(screen.getByRole('button', { name: /^etapa$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^série$/i }));

        expect(screen.getByTestId('repeticoes-display-2')).toHaveTextContent('3×');
    });
});

// ── Série (blocos repetidos) ──────────────────────────────────────────────────

describe('TreinoEditDialog — série', () => {
    const onClose = vi.fn();
    const onSave  = vi.fn();

    /** Fartlek já expandido pelo backend: 4 pares idênticos, sem blocoId. */
    const FARTLEK: TreinoPlanejadoDto = {
        id: 'treino-2',
        diaSemana: 'TERCA',
        tipoTreino: 'FARTLEK',
        distanciaKm: 8,
        duracaoMin: 'PT50M',
        zonaAlvo: 'Z4',
        percepcaoEsforcoEsperada: 8,
        tssPlanejado: 90,
        editadoPeloCoach: false,
        etapas: [
            etapa(1, 'AQUECIMENTO', 5, 'Z2'),
            etapa(2, 'INTERVALADO', 3, 'Z4'),
            etapa(3, 'RECUPERACAO', 2, 'Z1'),
            etapa(4, 'INTERVALADO', 3, 'Z4'),
            etapa(5, 'RECUPERACAO', 2, 'Z1'),
            etapa(6, 'INTERVALADO', 3, 'Z4'),
            etapa(7, 'RECUPERACAO', 2, 'Z1'),
            etapa(8, 'INTERVALADO', 3, 'Z4'),
            etapa(9, 'RECUPERACAO', 2, 'Z1'),
            etapa(10, 'DESAQUECIMENTO', 5, 'Z1'),
        ],
    };

    const renderFartlek = (treino: TreinoPlanejadoDto = FARTLEK) =>
        render(
            <TreinoEditDialog open treino={treino} isSaving={false} onClose={onClose} onSave={onSave} />,
        );

    beforeEach(() => vi.clearAllMocks());

    it('hidrata a série como um bloco 4×, entre aquecimento e desaquecimento avulsos', () => {
        renderFartlek();

        expect(screen.getByText('SÉRIE')).toBeInTheDocument();
        expect(screen.getByTestId('repeticoes-display-1')).toHaveTextContent('4×');
        expect(screen.getByText('AQUECIMENTO')).toBeInTheDocument();
        expect(screen.getByText('DESAQUECIMENTO')).toBeInTheDocument();
    });

    it('stepper altera as repetições da série dentro do limite 1–20', () => {
        renderFartlek();

        fireEvent.click(screen.getByLabelText(/Aumentar repetições da série 2/i));
        expect(screen.getByTestId('repeticoes-display-1')).toHaveTextContent('5×');

        fireEvent.click(screen.getByLabelText(/Diminuir repetições da série 2/i));
        expect(screen.getByTestId('repeticoes-display-1')).toHaveTextContent('4×');
    });

    it('timeline desenha uma barra por repetição, não um bloco agregado', () => {
        renderFartlek();

        ['1/4', '2/4', '3/4', '4/4'].forEach(label =>
            expect(screen.getByText(label)).toBeInTheDocument(),
        );
        // duração por barra é a de UMA repetição (3 min), não o agregado
        expect(screen.getAllByText('3 min')).toHaveLength(4);
    });

    it('salvar sem alterar não envia etapas — edição administrativa não regrava a série', () => {
        // A guarda mais importante do dialog: mudar só o TSS não pode reescrever a estrutura.
        renderFartlek();

        fireEvent.change(screen.getByDisplayValue('90'), { target: { value: '85' } });
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        expect(onSave).toHaveBeenCalledOnce();
        const patch: TreinoPlanejadoPatch = onSave.mock.calls[0][0];
        expect(patch.tssPlanejado).toBe(85);
        expect(patch.etapas).toBeUndefined();
    });

    it('alterar a série envia etapas com o bloco preservado', () => {
        renderFartlek();

        fireEvent.click(screen.getByLabelText(/Aumentar repetições da série 2/i));
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        const patch: TreinoPlanejadoPatch = onSave.mock.calls[0][0];
        expect(patch.etapas).toBeDefined();
        const bloco = patch.etapas?.find(e => e.tipoEtapa === 'BLOCO');
        expect(bloco).toMatchObject({ blocoRepeticoes: 5 });
        expect(bloco?.subEtapas).toHaveLength(2);
    });

    it('avisa antes de salvar um treino que perdeu o aquecimento', () => {
        renderFartlek();

        // remove o primeiro item (aquecimento)
        fireEvent.click(screen.getByLabelText(/Remover etapa 1$/i));
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        // não salva ainda — pede confirmação
        expect(onSave).not.toHaveBeenCalled();
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /salvar assim/i }));
        expect(onSave).toHaveBeenCalledOnce();
    });
});
