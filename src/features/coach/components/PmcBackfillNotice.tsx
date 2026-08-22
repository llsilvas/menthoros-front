import { Alert, AlertTitle } from '@mui/material';

export interface PmcBackfillNoticeProps {
    /** Chamado ao dispensar o aviso. */
    onDismiss: () => void;
}

/**
 * Aviso de que o histórico de PMC foi recalculado (task 6.2b, `ingestao-treino-realizado`) —
 * treinos cancelados deixaram de contar na carga e o TSS de dispositivo passou a ser respeitado.
 * Sem contexto, o coach vê o gráfico de datas passadas mudar sozinho e pode ler como bug.
 */
export function PmcBackfillNotice({ onDismiss }: PmcBackfillNoticeProps) {
    return (
        <Alert severity="info" onClose={onDismiss} sx={{ mb: 1.5 }}>
            <AlertTitle>Histórico de PMC atualizado</AlertTitle>
            Recalculamos os valores históricos: treinos cancelados agora ficam fora da carga e o
            TSS registrado pelo dispositivo passa a valer no gráfico. Datas passadas podem
            aparecer diferentes do que você viu antes — é uma correção, não um erro.
        </Alert>
    );
}
