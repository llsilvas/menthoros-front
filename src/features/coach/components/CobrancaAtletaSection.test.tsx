import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CobrancaAtletaSection } from './CobrancaAtletaSection';
import { ContratoAtletaService } from '../../../api/services/ContratoAtletaService';
import type { AthleteContract } from '../../../types/ContratoAtleta';

vi.mock('../../../api/services/ContratoAtletaService');

function contractFixture(overrides: Partial<AthleteContract> = {}): AthleteContract {
    return {
        id: 'contrato-1',
        athleteId: 'uuid-1',
        periodicity: 'MONTHLY',
        amount: 250,
        dueDay: 10,
        startDate: '2026-09-21',
        active: true,
        athleteNoticeEnabled: true,
        invoices: [],
        ...overrides,
    };
}

describe('CobrancaAtletaSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('exibe estado vazio quando não há contrato', async () => {
        vi.mocked(ContratoAtletaService.getContract).mockRejectedValue(
            Object.assign(new Error('not found'), { status: 404, name: 'ApiError' }),
        );
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        expect(await screen.findByText('Sem contrato ativo')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma mensalidade gerada ainda.')).toBeInTheDocument();
    });

    it('exige valor no formulário antes de salvar', async () => {
        vi.mocked(ContratoAtletaService.getContract).mockRejectedValue(
            Object.assign(new Error('not found'), { status: 404, name: 'ApiError' }),
        );
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);
        await screen.findByText('Sem contrato ativo');

        await user.type(screen.getByLabelText('Dia do vencimento'), '10');
        await user.type(screen.getByLabelText('Início'), '2026-09-21');
        await user.click(screen.getByRole('button', { name: /criar contrato/i }));

        expect(await screen.findByText('Valor é obrigatório')).toBeInTheDocument();
        expect(ContratoAtletaService.upsertContract).not.toHaveBeenCalled();
    });

    it('dá baixa com valor default (sem body)', async () => {
        const contract = contractFixture({
            invoices: [
                { id: 'inv-1', contractId: 'contrato-1', dueDate: '2026-10-10', amount: 250, status: 'OPEN', overdue: false },
            ],
        });
        vi.mocked(ContratoAtletaService.getContract).mockResolvedValue(contract);
        vi.mocked(ContratoAtletaService.markInvoicePaid).mockResolvedValue({
            ...contract.invoices[0], status: 'PAID', paidAt: '2026-09-21', paidAmount: 250,
        });
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        await user.click(await screen.findByRole('button', { name: /dar baixa/i }));

        await waitFor(() =>
            expect(ContratoAtletaService.markInvoicePaid).toHaveBeenCalledWith('inv-1', undefined),
        );
    });

    it('não oferece cancelar para mensalidade paga', async () => {
        const contract = contractFixture({
            invoices: [
                { id: 'inv-1', contractId: 'contrato-1', dueDate: '2026-09-10', amount: 250, status: 'PAID', paidAt: '2026-09-08', paidAmount: 250, overdue: false },
            ],
        });
        vi.mocked(ContratoAtletaService.getContract).mockResolvedValue(contract);
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        await screen.findByText('Paga');
        expect(screen.queryByRole('button', { name: /^cancelar$/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /desfazer baixa/i })).toBeInTheDocument();
    });
});
