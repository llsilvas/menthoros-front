/** Contrato do atleta com a assessoria — só visível ao proprietário (`GET /atletas/{id}/contrato`). */

/** Periodicidade do contrato — distinta do plano SaaS da assessoria com a Menthoros. */
export type ContractPeriodicity = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';

/** Estado persistido da mensalidade. "Vencida" não é estado: é `overdue` derivado em leitura. */
export type InvoiceStatus = 'OPEN' | 'PAID' | 'CANCELLED';

/** Mensalidade gerada pelo contrato do atleta. */
export interface AthleteInvoice {
    id: string;
    contractId: string;
    dueDate: string;
    /** Ausente no contrato migrado sem valor. */
    amount?: number;
    status: InvoiceStatus;
    /** Presente só em PAID. */
    paidAt?: string;
    /** Presente só em PAID. */
    paidAmount?: number;
    /** Derivado: OPEN e vencimento anterior a hoje. */
    overdue: boolean;
}

/** Contrato do atleta com a assessoria e suas mensalidades (mais recente primeiro). */
export interface AthleteContract {
    id: string;
    athleteId: string;
    periodicity: ContractPeriodicity;
    /** Ausente no contrato migrado sem valor. */
    amount?: number;
    dueDay: number;
    startDate: string;
    /** Ausente enquanto o contrato está ativo. */
    endedAt?: string;
    active: boolean;
    athleteNoticeEnabled: boolean;
    invoices: AthleteInvoice[];
}

/** Cria ou edita (upsert) o contrato ativo do atleta. Editar vale só para mensalidades futuras. */
export interface UpsertAthleteContract {
    periodicity: ContractPeriodicity;
    amount?: number;
    dueDay: number;
    startDate: string;
    /** Default `true` no backend quando ausente. */
    athleteNoticeEnabled?: boolean;
}

/** Baixa de mensalidade. Ambos os campos são opcionais: data default hoje, valor default o da mensalidade. */
export interface RecordInvoicePayment {
    paidAt?: string;
    paidAmount?: number;
}
