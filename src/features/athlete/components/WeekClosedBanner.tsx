import { Alert, AlertTitle } from '@mui/material';

export interface WeekClosedBannerProps {
    /** Quantidade de treinos perdidos na semana encerrada. */
    treinosPerdidos: number;
    /** Chamado ao dispensar o banner (X). */
    onDismiss?: () => void;
}

/**
 * Banner contextual de retenção: avisa o atleta que a semana foi encerrada pelo
 * treinador com treinos perdidos. Tom positivo (não punitivo) — a próxima semana
 * é uma nova chance. Dispensável.
 */
export function WeekClosedBanner({ treinosPerdidos, onDismiss }: WeekClosedBannerProps) {
    // Auto-defensivo: sem treinos perdidos não há o que anunciar.
    if (treinosPerdidos <= 0) {
        return null;
    }
    const plural = treinosPerdidos === 1 ? 'treino ficou' : 'treinos ficaram';
    return (
        <Alert severity="info" onClose={onDismiss}>
            <AlertTitle>Sua semana foi encerrada</AlertTitle>
            {treinosPerdidos} {plural} para trás — a próxima semana é uma nova chance. Bora recomeçar forte.
        </Alert>
    );
}
