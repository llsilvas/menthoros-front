import { useCallback, useEffect, useState } from 'react';
import { ContratoAtletaService } from '../../../api/services/ContratoAtletaService';
import { ApiError } from '../../../api/core/ApiError';
import type {
    RecordInvoicePayment,
    UpsertAthleteContract,
} from '../../../types/ContratoAtleta';

/**
 * Contrato do atleta com a assessoria e suas mensalidades — só o proprietário chama isto
 * (`ContratoAtletaService`, restrito a PROPRIETARIO/ADMIN no backend). 404 sem contrato ativo
 * é estado normal (`contract: null`), não erro.
 */
export const useAthleteContract = (athleteId: string | undefined) => {
    const [contract, setContract] = useState<Awaited<ReturnType<typeof ContratoAtletaService.getContract>> | null>(null);
    const [loading, setLoading] = useState(false);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchContract = useCallback(async () => {
        if (!athleteId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await ContratoAtletaService.getContract(athleteId);
            setContract(data);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setContract(null);
            } else {
                setError(err instanceof Error ? err : new Error('Erro ao buscar contrato do atleta'));
            }
        } finally {
            setLoading(false);
        }
    }, [athleteId]);

    const upsertContract = useCallback(async (input: UpsertAthleteContract) => {
        if (!athleteId) return;
        try {
            setActing(true);
            setError(null);
            await ContratoAtletaService.upsertContract(athleteId, input);
            await fetchContract();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao salvar contrato'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [athleteId, fetchContract]);

    const endContract = useCallback(async () => {
        if (!athleteId) return;
        try {
            setActing(true);
            setError(null);
            await ContratoAtletaService.endContract(athleteId);
            await fetchContract();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao encerrar contrato'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [athleteId, fetchContract]);

    const markInvoicePaid = useCallback(async (invoiceId: string, body?: RecordInvoicePayment) => {
        try {
            setActing(true);
            setError(null);
            await ContratoAtletaService.markInvoicePaid(invoiceId, body);
            await fetchContract();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao dar baixa na mensalidade'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [fetchContract]);

    const undoInvoicePayment = useCallback(async (invoiceId: string) => {
        try {
            setActing(true);
            setError(null);
            await ContratoAtletaService.undoInvoicePayment(invoiceId);
            await fetchContract();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao desfazer a baixa'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [fetchContract]);

    const cancelInvoice = useCallback(async (invoiceId: string) => {
        try {
            setActing(true);
            setError(null);
            await ContratoAtletaService.cancelInvoice(invoiceId);
            await fetchContract();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao cancelar mensalidade'));
            throw err;
        } finally {
            setActing(false);
        }
    }, [fetchContract]);

    useEffect(() => {
        fetchContract();
    }, [fetchContract]);

    return {
        contract,
        loading,
        acting,
        error,
        fetchContract,
        upsertContract,
        endContract,
        markInvoicePaid,
        undoInvoicePayment,
        cancelInvoice,
    };
};
