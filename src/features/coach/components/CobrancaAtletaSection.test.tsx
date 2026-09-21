import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CobrancaAtletaSection } from './CobrancaAtletaSection';
import { ContratoAtletaService } from '../../../api/services/ContratoAtletaService';
import { ApiError } from '../../../api/core/ApiError';
import type { AthleteContract } from '../../../types/ContratoAtleta';

vi.mock('../../../api/services/ContratoAtletaService');

function notFoundError(): ApiError {
    return new ApiError(
        { method: 'GET', url: '/api/v1/atletas/uuid-1/contrato' },
        { url: '', ok: false, status: 404, statusText: 'Not Found', body: null },
        'not found',
    );
}

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
        vi.mocked(ContratoAtletaService.getContract).mockRejectedValue(notFoundError());
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        expect(await screen.findByText('Sem contrato ativo')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma mensalidade gerada ainda.')).toBeInTheDocument();
    });

    it('exige valor no formulário antes de salvar', async () => {
        vi.mocked(ContratoAtletaService.getContract).mockRejectedValue(notFoundError());
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);
        await screen.findByText('Sem contrato ativo');

        await user.type(screen.getByLabelText('Dia do vencimento'), '10');
        await user.type(screen.getByLabelText('Início'), '2026-09-21');
        await user.click(screen.getByRole('button', { name: /criar contrato/i }));

        expect(await screen.findByText('Valor é obrigatório e não pode ser negativo')).toBeInTheDocument();
        expect(ContratoAtletaService.upsertContract).not.toHaveBeenCalled();
    });

    it('rejeita dia de vencimento fracionário', async () => {
        vi.mocked(ContratoAtletaService.getContract).mockRejectedValue(notFoundError());
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);
        await screen.findByText('Sem contrato ativo');

        fireEvent.change(screen.getByLabelText('Dia do vencimento'), { target: { value: '1.5' } });
        await user.type(screen.getByLabelText('Início'), '2026-09-21');
        await user.type(screen.getByLabelText('Valor'), '250');
        await user.click(screen.getByRole('button', { name: /criar contrato/i }));

        expect(await screen.findByText('Dia de vencimento deve ser um número inteiro entre 1 e 31')).toBeInTheDocument();
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

    it('cancelar mensalidade exige confirmação', async () => {
        const contract = contractFixture({
            invoices: [
                { id: 'inv-1', contractId: 'contrato-1', dueDate: '2026-10-10', amount: 250, status: 'OPEN', overdue: false },
            ],
        });
        vi.mocked(ContratoAtletaService.getContract).mockResolvedValue(contract);
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        await user.click(await screen.findByRole('button', { name: /^cancelar$/i }));
        expect(ContratoAtletaService.cancelInvoice).not.toHaveBeenCalled();

        await user.click(await screen.findByRole('button', { name: /cancelar mensalidade/i }));
        await waitFor(() => expect(ContratoAtletaService.cancelInvoice).toHaveBeenCalledWith('inv-1'));
    });

    it('encerrar contrato exige confirmação', async () => {
        const contract = contractFixture();
        vi.mocked(ContratoAtletaService.getContract).mockResolvedValue(contract);
        vi.mocked(ContratoAtletaService.endContract).mockResolvedValue({ ...contract, active: false });
        const user = userEvent.setup();
        render(<CobrancaAtletaSection athleteId="uuid-1" />);

        await user.click(await screen.findByRole('button', { name: /encerrar contrato/i }));
        expect(ContratoAtletaService.endContract).not.toHaveBeenCalled();

        await user.click(await screen.findByRole('button', { name: /^encerrar$/i }));
        await waitFor(() => expect(ContratoAtletaService.endContract).toHaveBeenCalledWith('uuid-1'));
    });
});
