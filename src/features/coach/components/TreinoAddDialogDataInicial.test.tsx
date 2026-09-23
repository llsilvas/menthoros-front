import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreinoAddDialog } from './TreinoAddDialog';
import type { TreinoPlanejadoDto } from '../../../types/PlanoReview';

vi.mock('../../../hooks/useTreinoPlanejado', () => ({
    useTreinoPlanejado: () => ({ isSaving: false, adicionarTreino: vi.fn() }),
}));

/**
 * show-descanso-no-plano, task 2.3a (CA3c): a data inicial precisa valer **a cada abertura**.
 * O dialog não desmonta entre aberturas (`CoachPlanReviewPage.tsx:336`) e limpa o form no
 * `resetForm` ao fechar — inicializar `useState` uma vez não basta.
 */
describe('TreinoAddDialog — data inicial', () => {
    const props = {
        planoId: 'plano-1',
        semanaInicio: '2026-09-21',
        semanaFim: '2026-09-27',
        treinosExistentes: [] as TreinoPlanejadoDto[],
        onClose: vi.fn(),
        onSaved: vi.fn(),
    };

    const campoData = () => screen.getByLabelText(/data/i) as HTMLInputElement;

    beforeEach(() => vi.clearAllMocks());

    it('abre com a data pré-preenchida quando recebe dataInicial', () => {
        render(<TreinoAddDialog {...props} open dataInicial="2026-09-24" />);

        expect(campoData().value).toBe('2026-09-24');
    });

    it('sem dataInicial, o campo continua vazio (abertura pelo botão genérico)', () => {
        render(<TreinoAddDialog {...props} open />);

        expect(campoData().value).toBe('');
    });

    it('CA3c: reabrir com outra data traz a nova data, não a anterior', () => {
        const { rerender } = render(<TreinoAddDialog {...props} open dataInicial="2026-09-24" />);
        expect(campoData().value).toBe('2026-09-24');

        // fecha (o form é limpo) e reabre por outro dia
        rerender(<TreinoAddDialog {...props} open={false} dataInicial="2026-09-24" />);
        rerender(<TreinoAddDialog {...props} open dataInicial="2026-09-26" />);

        expect(campoData().value).toBe('2026-09-26');
    });

    it('CA3d: a data continua editável — o treinador pode mudar o dia antes de salvar', () => {
        render(<TreinoAddDialog {...props} open dataInicial="2026-09-24" />);

        // input[type=date] não aceita clear/type do user-event; a edição real é um change.
        fireEvent.change(campoData(), { target: { value: '2026-09-25' } });

        expect(campoData().value).toBe('2026-09-25');
    });
});
