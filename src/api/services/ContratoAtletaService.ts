import type {
    AthleteContract,
    AthleteInvoice,
    RecordInvoicePayment,
    UpsertAthleteContract,
} from '../../types/ContratoAtleta';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

/**
 * Contrato do atleta e mensalidades — só o proprietário da assessoria (e ADMIN da plataforma).
 * Tenant resolvido no backend via `TenantContext`; nunca envia `X-Tenant-ID` manualmente.
 */
export class ContratoAtletaService {
    /**
     * Contrato ativo do atleta com as mensalidades (mais recente primeiro).
     * @param athleteId UUID do atleta
     * @returns AthleteContract contrato ativo
     * @throws ApiError 404 sem contrato ativo, atleta inexistente ou de outro tenant
     */
    public static getContract(athleteId: string): CancelablePromise<AthleteContract> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/v1/atletas/${athleteId}/contrato`,
        });
    }

    /**
     * Cria ou edita (upsert) o contrato ativo do atleta. Criar gera a primeira mensalidade;
     * editar vale só para mensalidades futuras.
     * @throws ApiError 409 em criação concorrente — repetir a requisição
     */
    public static upsertContract(
        athleteId: string,
        body: UpsertAthleteContract,
    ): CancelablePromise<AthleteContract> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: `/api/v1/atletas/${athleteId}/contrato`,
            body,
            mediaType: 'application/json',
        });
    }

    /** Encerra o contrato ativo; mensalidades em aberto ficam como estão. */
    public static endContract(athleteId: string): CancelablePromise<AthleteContract> {
        return __request(OpenAPI, {
            method: 'POST',
            url: `/api/v1/atletas/${athleteId}/contrato/encerrar`,
        });
    }

    /**
     * Dá baixa na mensalidade (OPEN → PAID). Data default hoje; valor pago default o valor da
     * mensalidade.
     * @throws ApiError 409 mensalidade não está em aberto
     */
    public static markInvoicePaid(
        invoiceId: string,
        body?: RecordInvoicePayment,
    ): CancelablePromise<AthleteInvoice> {
        return __request(OpenAPI, {
            method: 'POST',
            url: `/api/v1/mensalidades/${invoiceId}/baixa`,
            body,
            mediaType: 'application/json',
        });
    }

    /**
     * Desfaz a baixa (PAID → OPEN).
     * @throws ApiError 409 mensalidade não está paga
     */
    public static undoInvoicePayment(invoiceId: string): CancelablePromise<AthleteInvoice> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: `/api/v1/mensalidades/${invoiceId}/baixa`,
        });
    }

    /**
     * Cancela a mensalidade (OPEN → CANCELLED): este período não cobra.
     * @throws ApiError 409 mensalidade não está em aberto
     */
    public static cancelInvoice(invoiceId: string): CancelablePromise<AthleteInvoice> {
        return __request(OpenAPI, {
            method: 'POST',
            url: `/api/v1/mensalidades/${invoiceId}/cancelar`,
        });
    }
}
