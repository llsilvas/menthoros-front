import { useCallback, useEffect, useRef, useState } from 'react';
import { ContratoAtletaService } from '../../../api/services/ContratoAtletaService';
import { ApiError } from '../../../api/core/ApiError';
import type {
    AthleteContract,
    AthleteInvoice,
    RecordInvoicePayment,
    UpsertAthleteContract,
} from '../../../types/ContratoAtleta';

/**
 * Mensagem amigável por status HTTP — nunca propaga `err.message` de um `ApiError` para a UI:
 * para status sem mapeamento em `request.ts`, a mensagem crua embute o corpo da resposta do
 * backend (`Generic Error: status: ...; body: ...`), que pode ecoar dado financeiro/PII.
 */
function friendlyErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
        switch (err.status) {
            case 409:
                return 'O estado mudou nesse meio-tempo — atualize a página e tente de novo.';
            case 400:
                return 'Dados inválidos.';
            case 403:
                return 'Você não tem permissão para esta ação.';
            case 404:
                return 'Registro não encontrado.';
            default:
                return fallback;
        }
    }
    return fallback;
}

/**
 * Contrato do atleta com a assessoria e suas mensalidades — só o proprietário chama isto
 * (`ContratoAtletaService`, restrito a PROPRIETARIO/ADMIN no backend). 404 sem contrato ativo
 * é estado normal (`contract: null`), não erro.
 */
export const useAthleteContract = (athleteId: string | undefined) => {
    const [contract, setContract] = useState<AthleteContract | null>(null);
    const [loading, setLoading] = useState(false);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Guarda contra resposta tardia de um athleteId anterior sobrescrever o atleta atual
    // (troca rápida de atleta na mesma página) — dado financeiro do atleta errado na tela.
    const athleteIdRef = useRef(athleteId);
    athleteIdRef.current = athleteId;

    const fetchContract = useCallback(async () => {
        if (!athleteId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await ContratoAtletaService.getContract(athleteId);
            if (athleteIdRef.current === athleteId) setContract(data);
        } catch (err) {
            if (athleteIdRef.current !== athleteId) return;
            if (err instanceof ApiError && err.status === 404) {
                setContract(null);
            } else {
                setError(new Error(friendlyErrorMessage(err, 'Erro ao buscar contrato do atleta')));
            }
        } finally {
            if (athleteIdRef.current === athleteId) setLoading(false);
        }
    }, [athleteId]);

    /** Encapsula acting/error/finally de uma mutação; aplica o resultado ao estado do contrato. */
    const runAction = useCallback(async <T,>(
        action: () => Promise<T>,
        errorMessage: string,
        applyResult: (result: T) => void,
    ): Promise<T> => {
        try {
            setActing(true);
            setError(null);
            const result = await action();
            if (athleteIdRef.current === athleteId) applyResult(result);
            return result;
        } catch (err) {
            setError(new Error(friendlyErrorMessage(err, errorMessage)));
            throw err;
        } finally {
            setActing(false);
        }
    }, [athleteId]);

    const applyInvoice = useCallback((invoice: AthleteInvoice) => {
        setContract((prev) => {
            if (!prev) return prev;
            return { ...prev, invoices: prev.invoices.map((inv) => (inv.id === invoice.id ? invoice : inv)) };
        });
    }, []);

    const upsertContract = useCallback((input: UpsertAthleteContract) => {
        if (!athleteId) return Promise.resolve(undefined as unknown as AthleteContract);
        return runAction(
            () => ContratoAtletaService.upsertContract(athleteId, input),
            'Erro ao salvar contrato',
            setContract,
        );
    }, [athleteId, runAction]);

    const endContract = useCallback(() => {
        if (!athleteId) return Promise.resolve(undefined as unknown as AthleteContract);
        // Usa a resposta do POST diretamente — um GET depois daria 404 (só retorna contrato
        // ativo) e apagaria da tela as mensalidades em aberto que o contrato encerrado preserva.
        return runAction(
            () => ContratoAtletaService.endContract(athleteId),
            'Erro ao encerrar contrato',
            setContract,
        );
    }, [athleteId, runAction]);

    const markInvoicePaid = useCallback((invoiceId: string, body?: RecordInvoicePayment) => {
        return runAction(
            () => ContratoAtletaService.markInvoicePaid(invoiceId, body),
            'Erro ao dar baixa na mensalidade',
            applyInvoice,
        );
    }, [runAction, applyInvoice]);

    const undoInvoicePayment = useCallback((invoiceId: string) => {
        return runAction(
            () => ContratoAtletaService.undoInvoicePayment(invoiceId),
            'Erro ao desfazer a baixa',
            applyInvoice,
        );
    }, [runAction, applyInvoice]);

    const cancelInvoice = useCallback((invoiceId: string) => {
        return runAction(
            () => ContratoAtletaService.cancelInvoice(invoiceId),
            'Erro ao cancelar mensalidade',
            applyInvoice,
        );
    }, [runAction, applyInvoice]);

    useEffect(() => {
        setContract(null);
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
