import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { isSameDay, parseISO } from 'date-fns';
import { surface, glassSx, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { ManualTrainingForm } from '../components/ManualTrainingForm';
import { RecentTrainingsList } from '../components/RecentTrainingsList';
import { PostWorkoutFeedbackCard } from '../components/PostWorkoutFeedbackCard';
import type { TreinoManualInput, TreinoRealizadoDto } from '../../../types/TreinoManual';
import { ROUTES } from '../../../constants/routes';

export default function ManualTrainingFormPage() {
    const navigate = useNavigate();
    const { recentes, isFetching, isSubmitting, fetchError, registrar, fetchRecentes } = useManualTraining(7);
    const [treinoRegistrado, setTreinoRegistrado] = useState<TreinoRealizadoDto | null>(null);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        fetchRecentes();
    }, [fetchRecentes]);

    const hasTreinoHoje = useMemo(
        () => recentes.some((t) => isSameDay(parseISO(t.dataTreino), new Date())),
        [recentes]
    );

    const handleSubmit = useCallback(async (input: TreinoManualInput) => {
        try {
            const salvo = await registrar(input);
            setTreinoRegistrado(salvo);
        } catch {
            setToast({ open: true, message: 'Erro ao registrar treino. Tente novamente.', severity: 'error' });
        }
    }, [registrar]);

    return (
        <Box
            sx={{
                minHeight: '100%',
                bgcolor: elevation.base,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
            }}
        >
            <Box>
                <Typography
                    sx={{
                        color: surface[50],
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        fontFamily: 'Syne, sans-serif',
                    }}
                >
                    Registrar treino
                </Typography>
                <Typography sx={{ color: surface[400], fontSize: '0.85rem', mt: 0.5 }}>
                    Registre um treino realizado nos últimos 7 dias.
                </Typography>
            </Box>

            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                {treinoRegistrado ? (
                    <PostWorkoutFeedbackCard
                        treino={treinoRegistrado}
                        onVoltar={() => navigate(ROUTES.ATHLETE_HOME)}
                    />
                ) : (
                    <ManualTrainingForm
                        loading={isSubmitting}
                        hasTreinoHoje={hasTreinoHoje}
                        onSubmit={handleSubmit}
                    />
                )}
            </Box>

            <Box>
                <Typography
                    sx={{
                        color: surface[50],
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        mb: 1.5,
                    }}
                >
                    Últimos 7 dias
                </Typography>
                {fetchError && (
                    <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                        Erro ao carregar treinos recentes. Tente novamente.
                    </Alert>
                )}
                {isFetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} sx={{ color: primary[500] }} />
                    </Box>
                ) : (
                    <RecentTrainingsList treinos={recentes} />
                )}
            </Box>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={toast.severity}
                    onClose={() => setToast((s) => ({ ...s, open: false }))}
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
