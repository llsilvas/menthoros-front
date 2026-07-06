import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EncerrarLoteDialog } from './EncerrarLoteDialog';
import { CoachSemanaService } from '../../../api/services/CoachSemanaService';
import type { EncerramentoLoteResult } from '../../../types/Encerramento';

vi.mock('../../../api/services/CoachSemanaService');

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
    beforeEach(() => vi.clearAllMocks());

    it('carrega o preview e exibe o impacto sem encerrar (preview obrigatório)', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(PREVIEW);

        render(<EncerrarLoteDialog open onClose={vi.fn()} />);

        expect(await screen.findByText(/23/)).toBeInTheDocument();
        expect(CoachSemanaService.encerrarLote).not.toHaveBeenCalled();
    });

    it('cancelar fecha sem encerrar (no-op)', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(PREVIEW);
        const onClose = vi.fn();

        render(<EncerrarLoteDialog open onClose={onClose} />);
        await screen.findByText(/23/);
        await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }));

        expect(onClose).toHaveBeenCalled();
        expect(CoachSemanaService.encerrarLote).not.toHaveBeenCalled();
    });

    it('confirmar encerra e mostra o resumo com as falhas (nome resolvido)', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(PREVIEW);
        vi.mocked(CoachSemanaService.encerrarLote).mockResolvedValue(RESULT);

        render(<EncerrarLoteDialog open onClose={vi.fn()} resolveNomeAtleta={() => 'Ana Silva'} />);
        await screen.findByText(/23/);
        await userEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/ }));

        await waitFor(() => expect(CoachSemanaService.encerrarLote).toHaveBeenCalled());
        expect(await screen.findByText(/Falhas \(1\)/)).toBeInTheDocument();
        expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    });

    it('encaminha os atletaIds selecionados ao preview e ao encerrar', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(PREVIEW);
        vi.mocked(CoachSemanaService.encerrarLote).mockResolvedValue(RESULT);

        render(<EncerrarLoteDialog open onClose={vi.fn()} atletaIds={['a1', 'a2']} />);

        await waitFor(() => expect(CoachSemanaService.previewEncerrarLote).toHaveBeenCalledWith(['a1', 'a2']));
        await userEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/ }));
        await waitFor(() => expect(CoachSemanaService.encerrarLote).toHaveBeenCalledWith(['a1', 'a2']));
    });

    it('erro ao carregar o preview exibe a mensagem de projeção', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockRejectedValue(new Error('403'));

        render(<EncerrarLoteDialog open onClose={vi.fn()} />);

        expect(await screen.findByText(/Não foi possível carregar a projeção/)).toBeInTheDocument();
    });

    it('erro ao encerrar (após preview ok) exibe a mensagem de lote', async () => {
        vi.mocked(CoachSemanaService.previewEncerrarLote).mockResolvedValue(PREVIEW);
        vi.mocked(CoachSemanaService.encerrarLote).mockRejectedValue(new Error('500'));

        render(<EncerrarLoteDialog open onClose={vi.fn()} />);
        await screen.findByText(/23/);
        await userEvent.click(screen.getByRole('button', { name: /Confirmar encerramento/ }));

        expect(await screen.findByText(/Não foi possível encerrar em lote/)).toBeInTheDocument();
    });
});
