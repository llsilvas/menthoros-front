import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EncerrarLoteDialog } from './EncerrarLoteDialog';
import { useEncerrarSemana } from '../../../hooks/useEncerrarSemana';
import type { EncerramentoLoteResult } from '../../../types/Encerramento';

vi.mock('../../../hooks/useEncerrarSemana');

const PREVIEW: EncerramentoLoteResult = {
    atletasProcessados: 8,
    atletasSemPlano: 2,
    planosConcluidos: 8,
    treinosPerdidosTotal: 23,
    resultados: [],
    falhas: [],
};

const RESULT: EncerramentoLoteResult = {
    ...PREVIEW,
    falhas: [{ atletaId: 'a1', motivo: 'Conflito de edição concorrente' }],
};

describe('EncerrarLoteDialog', () => {
    let previewLote: ReturnType<typeof vi.fn>;
    let encerrarLote: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        previewLote = vi.fn().mockResolvedValue(PREVIEW);
        encerrarLote = vi.fn().mockResolvedValue(RESULT);
        vi.mocked(useEncerrarSemana).mockReturnValue({
            encerrarSemana: vi.fn(),
            previewLote,
            encerrarLote,
            loading: false,
            error: null,
        });
    });

    it('carrega o preview e exibe o impacto sem encerrar (preview obrigatório)', async () => {
        render(<EncerrarLoteDialog open onClose={vi.fn()} />);

        await waitFor(() => expect(previewLote).toHaveBeenCalled());
        expect(await screen.findByText(/23/)).toBeInTheDocument();
        expect(encerrarLote).not.toHaveBeenCalled();
    });

    it('cancelar fecha sem encerrar (no-op)', async () => {
        const onClose = vi.fn();
        render(<EncerrarLoteDialog open onClose={onClose} />);
        await waitFor(() => expect(previewLote).toHaveBeenCalled());

        await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }));

        expect(onClose).toHaveBeenCalled();
        expect(encerrarLote).not.toHaveBeenCalled();
    });

    it('confirmar encerra e mostra o resumo com as falhas', async () => {
        render(<EncerrarLoteDialog open onClose={vi.fn()} onEncerrado={vi.fn()} />);
        await waitFor(() => expect(previewLote).toHaveBeenCalled());

        await userEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/ }));

        await waitFor(() => expect(encerrarLote).toHaveBeenCalled());
        expect(await screen.findByText(/Falhas \(1\)/)).toBeInTheDocument();
    });
});
