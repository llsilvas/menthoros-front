import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { SectionCard } from './SectionCard';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { surface } from '../../../theme/tokens';
import { useAthleteContract } from '../hooks/useAthleteContract';
import { formatProximoVencimento } from '../adapters/cobrancaAdapters';
import type { AthleteInvoice, ContractPeriodicity, UpsertAthleteContract } from '../../../types/ContratoAtleta';

interface CobrancaAtletaSectionProps {
    athleteId: string;
}

const PERIODICITY_LABELS: Readonly<Record<ContractPeriodicity, string>> = {
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    SEMIANNUAL: 'Semestral',
    ANNUAL: 'Anual',
};

function formatAmount(amount?: number): string {
    if (amount === undefined || amount === null) return '—';
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ContractFormState {
    periodicity: ContractPeriodicity;
    amount: string;
    dueDay: string;
    startDate: string;
    athleteNoticeEnabled: boolean;
}

function initialFormState(): ContractFormState {
    return {
        periodicity: 'MONTHLY',
        amount: '',
        dueDay: '',
        startDate: '',
        athleteNoticeEnabled: true,
    };
}

/**
 * Contrato do atleta com a assessoria — só montado para PROPRIETARIO (design D8). Formulário de
 * upsert, encerrar, e lista de mensalidades com baixa/desfazer/cancelar.
 */
export function CobrancaAtletaSection({ athleteId }: CobrancaAtletaSectionProps) {
    const {
        contract,
        loading,
        acting,
        error,
        upsertContract,
        endContract,
        markInvoicePaid,
        undoInvoicePayment,
        cancelInvoice,
    } = useAthleteContract(athleteId);

    const [form, setForm] = useState<ContractFormState>(initialFormState());
    const [formError, setFormError] = useState<string | null>(null);
    const [confirmEndContract, setConfirmEndContract] = useState(false);
    const [confirmCancelInvoiceId, setConfirmCancelInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        if (contract) {
            setForm({
                periodicity: contract.periodicity,
                amount: contract.amount !== undefined ? String(contract.amount) : '',
                dueDay: String(contract.dueDay),
                startDate: contract.startDate,
                athleteNoticeEnabled: contract.athleteNoticeEnabled,
            });
        } else {
            setForm(initialFormState());
        }
    }, [contract]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError(null);

        const dueDay = Number(form.dueDay);
        if (!form.dueDay || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
            setFormError('Dia de vencimento deve ser um número inteiro entre 1 e 31');
            return;
        }
        if (!form.startDate) {
            setFormError('Início do contrato é obrigatório');
            return;
        }
        const amount = Number(form.amount);
        if (!form.amount.trim() || !Number.isFinite(amount) || amount < 0) {
            setFormError('Valor é obrigatório e não pode ser negativo');
            return;
        }

        const input: UpsertAthleteContract = {
            periodicity: form.periodicity,
            amount,
            dueDay,
            startDate: form.startDate,
            athleteNoticeEnabled: form.athleteNoticeEnabled,
        };

        try {
            await upsertContract(input);
        } catch {
            setFormError('Erro ao salvar contrato');
        }
    };

    const invoiceVariant = (invoice: AthleteInvoice) => {
        if (invoice.status === 'CANCELLED') return { variant: 'inactive' as const, label: 'Cancelada' };
        if (invoice.status === 'PAID') return { variant: 'active' as const, label: 'Paga' };
        if (invoice.overdue) return { variant: 'danger' as const, label: 'Vencida' };
        return { variant: 'pending' as const, label: 'Em aberto' };
    };

    return (
        <SectionCard title="Cobrança">
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {error && (
                        <Typography variant="body2" sx={{ color: 'error.main' }}>
                            {error.message}
                        </Typography>
                    )}

                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ color: surface[300] }}>
                            {contract?.active ? 'Contrato ativo' : 'Sem contrato ativo'}
                        </Typography>

                        {formError && (
                            <Typography variant="body2" sx={{ color: 'error.main' }}>
                                {formError}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <TextField
                                select
                                label="Periodicidade"
                                size="small"
                                value={form.periodicity}
                                onChange={(e) => setForm((prev) => ({ ...prev, periodicity: e.target.value as ContractPeriodicity }))}
                                sx={{ minWidth: 160 }}
                            >
                                {(Object.keys(PERIODICITY_LABELS) as ContractPeriodicity[]).map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {PERIODICITY_LABELS[option]}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Valor"
                                type="number"
                                size="small"
                                value={form.amount}
                                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                                sx={{ minWidth: 120 }}
                            />
                            <TextField
                                label="Dia do vencimento"
                                type="number"
                                size="small"
                                value={form.dueDay}
                                onChange={(e) => setForm((prev) => ({ ...prev, dueDay: e.target.value }))}
                                slotProps={{ htmlInput: { min: 1, max: 31, step: 1 } }}
                                sx={{ minWidth: 140 }}
                            />
                            <TextField
                                label="Início"
                                type="date"
                                size="small"
                                value={form.startDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                                slotProps={{ inputLabel: { shrink: true } }}
                                sx={{ minWidth: 150 }}
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.athleteNoticeEnabled}
                                    onChange={(e) => setForm((prev) => ({ ...prev, athleteNoticeEnabled: e.target.checked }))}
                                />
                            }
                            label="Avisar o atleta por e-mail antes do vencimento"
                        />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button type="submit" variant="contained" disabled={acting} size="small" sx={PRIMARY_BTN_SX}>
                                {contract?.active ? 'Salvar contrato' : 'Criar contrato'}
                            </Button>
                            {contract?.active && (
                                <Button
                                    onClick={() => setConfirmEndContract(true)}
                                    disabled={acting}
                                    size="small"
                                    sx={GHOST_BTN_SX}
                                >
                                    Encerrar contrato
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ color: surface[300], mb: 1 }}>
                            Mensalidades
                        </Typography>
                        {!contract || contract.invoices.length === 0 ? (
                            <Typography variant="body2" sx={{ color: surface[500] }}>
                                Nenhuma mensalidade gerada ainda.
                            </Typography>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Vencimento</TableCell>
                                        <TableCell>Valor</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {contract.invoices.map((invoice) => {
                                        const badge = invoiceVariant(invoice);
                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell>{formatProximoVencimento(invoice.dueDate) || '—'}</TableCell>
                                                <TableCell>{formatAmount(invoice.amount)}</TableCell>
                                                <TableCell>
                                                    <StatusBadge variant={badge.variant} label={badge.label} size="sm" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {invoice.status === 'OPEN' && (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                disabled={acting}
                                                                onClick={() => markInvoicePaid(invoice.id)}
                                                            >
                                                                Dar baixa
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                disabled={acting}
                                                                onClick={() => setConfirmCancelInvoiceId(invoice.id)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {invoice.status === 'PAID' && (
                                                        <Button
                                                            size="small"
                                                            disabled={acting}
                                                            onClick={() => undoInvoicePayment(invoice.id)}
                                                        >
                                                            Desfazer baixa
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Box>
                </Box>
            )}

            <ConfirmDialog
                open={confirmEndContract}
                title="Encerrar contrato"
                message="As mensalidades em aberto continuam como estão. Esta ação não pode ser desfeita pela UI."
                confirmLabel="Encerrar"
                severity="danger"
                loading={acting}
                onClose={() => setConfirmEndContract(false)}
                onConfirm={async () => {
                    await endContract();
                    setConfirmEndContract(false);
                }}
            />

            <ConfirmDialog
                open={confirmCancelInvoiceId !== null}
                title="Cancelar mensalidade"
                message="Este período não será cobrado. Esta ação não pode ser desfeita pela UI."
                confirmLabel="Cancelar mensalidade"
                severity="danger"
                loading={acting}
                onClose={() => setConfirmCancelInvoiceId(null)}
                onConfirm={async () => {
                    if (confirmCancelInvoiceId) await cancelInvoice(confirmCancelInvoiceId);
                    setConfirmCancelInvoiceId(null);
                }}
            />
        </SectionCard>
    );
}
