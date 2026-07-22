import { Alert, AlertTitle } from '@mui/material';
import type { CalibrationStatus, CalibrationStage } from '../../../types/Calibracao';

export interface CalibrationBannerProps {
    /** Status atual de calibração — `null` quando o atleta não está em `CALIBRATION`. */
    status: CalibrationStatus | null;
    /** `true` quando o atleta acabou de sair de `CALIBRATION` (task 8.5) — mostra o banner de saída em vez do informativo. */
    justExited?: boolean;
    /** Chamado ao dispensar qualquer uma das duas variantes do banner. */
    onDismiss?: () => void;
}

const STAGE_MESSAGES: Record<CalibrationStage, string> = {
    OBSERVATION: 'Estamos observando seus primeiros treinos para calibrar seu plano.',
    CALIBRATION: 'Ajustando seu plano com base nos seus treinos recentes.',
    STABILIZATION: 'Quase lá — estabilizando seu plano com dados mais consistentes.',
};

/**
 * Banner informativo de calibração (task 8.2) — reaproveitado também para o aviso de saída de
 * `CALIBRATION` (task 8.5, design.md Decisão 5), sem canal de notificação novo.
 */
export function CalibrationBanner({ status, justExited = false, onDismiss }: CalibrationBannerProps) {
    if (justExited) {
        return (
            <Alert severity="success" onClose={onDismiss}>
                <AlertTitle>Calibração concluída!</AlertTitle>
                Seu plano agora reflete seu histórico real de treinos.
            </Alert>
        );
    }

    if (!status) {
        return null;
    }

    return (
        <Alert severity="info" onClose={onDismiss}>
            <AlertTitle>Semana {status.weekNumber} de calibração</AlertTitle>
            {STAGE_MESSAGES[status.stage]}
        </Alert>
    );
}
