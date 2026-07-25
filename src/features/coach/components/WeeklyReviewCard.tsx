import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';
import type { NivelAderencia, RecommendationType } from '../../../types/RevisaoSemanal';
import type { WeeklyReviewVM } from '../types/WeeklyAthleteReview';

interface WeeklyReviewCardProps {
    review: WeeklyReviewVM | null;
    isLoading: boolean;
    error: Error | null;
    naoDisponivel: boolean;
    onRetry: () => void;
}

/** Cor semântica do Chip por tipo de recomendação (RECOVERY = alerta, PROGRESS = positivo). */
const CHIP_COLOR: Record<RecommendationType, 'warning' | 'default' | 'success'> = {
    RECOVERY: 'warning',
    MAINTAIN: 'default',
    PROGRESS: 'success',
};

const ADERENCIA_COLOR: Record<NivelAderencia, string> = {
    ALTA: 'success.main',
    MEDIA: 'text.primary',
    BAIXA: 'warning.main',
};

/**
 * Card read-only da revisão semanal do atleta (Fatia 3). Renderiza loading/empty/error e o sinal
 * congelado. Sem nenhuma ação que altere o plano (CA10.2) — só o refetch do estado de erro.
 */
export function WeeklyReviewCard({ review, isLoading, error, naoDisponivel, onRetry }: WeeklyReviewCardProps) {
    if (isLoading) {
        return <Skeleton variant="rounded" height={120} />;
    }

    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={onRetry}>
                        Tentar novamente
                    </Button>
                }
            >
                Não foi possível carregar a revisão semanal.
            </Alert>
        );
    }

    if (naoDisponivel || !review) {
        return (
            <Alert severity="info">
                Nenhuma semana fechada ainda — a revisão aparece após o encerramento da semana.
            </Alert>
        );
    }

    return (
        <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
                Semana {review.periodo}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={review.recomendacao} size="small" color={CHIP_COLOR[review.recomendacaoTipo]} variant="outlined" />
                <Typography variant="body2">
                    Aderência:{' '}
                    <Box component="span" sx={{ color: ADERENCIA_COLOR[review.aderenciaNivel], fontWeight: 600 }}>
                        {review.aderencia}
                        {review.percentual != null ? ` (${review.percentual}%)` : ''}
                    </Box>
                </Typography>
            </Box>

            {review.deltaResumo && (
                <Typography variant="caption" color="text.secondary">
                    vs. semana anterior · {review.deltaResumo}
                </Typography>
            )}

            {review.nextWeekFocus && <Typography variant="body2">{review.nextWeekFocus}</Typography>}

            {!review.sufficientData && (
                <Typography variant="caption" color="warning.main">
                    Dados insuficientes na semana — leitura de menor confiança.
                </Typography>
            )}
        </Stack>
    );
}
