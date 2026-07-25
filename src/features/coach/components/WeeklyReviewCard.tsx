import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';
import type { WeeklyReviewVM } from '../types/WeeklyAthleteReview';

interface WeeklyReviewCardProps {
    review: WeeklyReviewVM | null;
    isLoading: boolean;
    error: Error | null;
    naoDisponivel: boolean;
    onRetry: () => void;
}

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
            <Alert severity="warning">
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
                <Chip label={review.recomendacao} size="small" color="primary" variant="outlined" />
                <Typography variant="body2">
                    Aderência: {review.aderencia}
                    {review.percentual != null ? ` (${review.percentual}%)` : ''}
                </Typography>
            </Box>

            {review.delta && (
                <Typography variant="caption" color="text.secondary">
                    vs. semana anterior
                    {review.delta.percentual != null ? ` · aderência ${formatDelta(review.delta.percentual)}%` : ''}
                    {review.delta.tsb != null ? ` · TSB ${formatDelta(review.delta.tsb)}` : ''}
                    {review.delta.recomendacaoAnterior ? ` · era "${review.delta.recomendacaoAnterior}"` : ''}
                </Typography>
            )}

            {review.nextWeekFocus && (
                <Typography variant="body2">{review.nextWeekFocus}</Typography>
            )}

            {!review.dadosSuficientes && (
                <Typography variant="caption" color="warning.main">
                    Dados insuficientes na semana — leitura de menor confiança.
                </Typography>
            )}
        </Stack>
    );
}

function formatDelta(valor: number): string {
    return valor > 0 ? `+${valor}` : String(valor);
}
