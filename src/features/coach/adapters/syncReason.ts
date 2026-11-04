export interface SyncReason {
    motivo: string;
    acao: string;
    /** Mensagem do backend; só vem em ERRO_VALIDACAO e SINCRONIZADO_PARCIAL. */
    detalhe?: string;
}

const MOTIVOS: Record<string, Omit<SyncReason, 'detalhe'>> = {
    ERRO_AUTENTICACAO: {
        motivo: 'Conexão do canal precisa de autorização',
        acao: 'Peça ao atleta que reautorize o Garmin Connect ou o intervals.icu; se persistir, fale com o suporte.',
    },
    ERRO_VALIDACAO: {
        motivo: 'O canal recusou o treino',
        acao: 'Ajuste o treino e reenvie.',
    },
    ERRO_LIMITE_RATE: {
        motivo: 'Limite de requisições do canal',
        acao: 'O sistema tenta de novo sozinho; reenvie se persistir.',
    },
    ERRO_TEMPORARIO: {
        motivo: 'Falha de comunicação com o canal',
        acao: 'O sistema tenta de novo sozinho; reenvie se persistir.',
    },
    ERRO_PERMANENTE: {
        motivo: 'Tentativas de envio esgotadas',
        acao: 'Reenvie ao relógio.',
    },
    SINCRONIZADO_PARCIAL: {
        motivo: 'Enviado com ajustes',
        acao: 'Confira o treino no relógio.',
    },
};

/** Status de erro de envio ao canal (`ERRO_*`). */
export function isErroSync(status?: string | null): boolean {
    return status?.startsWith('ERRO_') ?? false;
}

/** Traduz o status de sincronização do treino em motivo legível e ação sugerida ao treinador. */
export function buildSyncReasonFromStatus(status?: string, syncError?: string | null): SyncReason | null {
    if (!status) return null;
    const base = MOTIVOS[status]
        ?? (isErroSync(status)
            ? { motivo: 'Erro no envio ao relógio', acao: 'Reenvie ao relógio; se persistir, fale com o suporte.' }
            : null);
    if (!base) return null;
    return syncError ? { ...base, detalhe: syncError } : base;
}
