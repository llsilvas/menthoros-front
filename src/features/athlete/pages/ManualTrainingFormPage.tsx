import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import { isSameDay, parseISO } from 'date-fns';
import { surface, glassSx, primary } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { useFitUpload } from '../../../hooks/useFitUpload';
import { useCalibracao } from '../../../hooks/useCalibracao';
import { ManualTrainingForm } from '../components/ManualTrainingForm';
import { RecentTrainingsList } from '../components/RecentTrainingsList';
import { PostWorkoutFeedbackCard } from '../components/PostWorkoutFeedbackCard';
import { useAthleteWorkoutAnalysis } from '../hooks/useAthleteWorkoutAnalysis';
import { buildWorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';
import { FileUploadZone } from '../components/FileUploadZone';
import { FitUploadResultCard } from '../components/FitUploadResultCard';
import type { TreinoManualInput, TreinoRealizadoDto } from '../../../types/TreinoManual';
import { ROUTES } from '../../../constants/routes';

export default function ManualTrainingFormPage() {
    const navigate = useNavigate();
    // Vindo de "Concluí o treino" (modo treino): tipo e duração planejada pré-preenchem o
    // formulário. `state` é `unknown` no tipo do router — validado campo a campo, não confiado.
    const location = useLocation();
    const state = location.state as { tipo?: unknown; duracaoMinutos?: unknown } | null;
    const initial = state && (typeof state.tipo === 'string' || typeof state.duracaoMinutos === 'number')
        ? {
            tipo: typeof state.tipo === 'string' ? state.tipo : undefined,
            duracaoMinutos: typeof state.duracaoMinutos === 'number' ? state.duracaoMinutos : undefined,
        }
        : undefined;
    const { recentes, isFetching, isSubmitting, fetchError, registrar, fetchRecentes } = useManualTraining(7);
    const { upload, uploading, reset: resetFitUpload } = useFitUpload();
    const { status: calibracaoStatus, fetchStatus: fetchCalibracao } = useCalibracao();
    const [treinoRegistrado, setTreinoRegistrado] = useState<TreinoRealizadoDto | null>(null);
    // Análise da IA do treino recém-registrado: 200 PENDING já na primeira consulta (o backend
    // responde por elegibilidade antes mesmo de a linha existir) — o card mostra "Analisando…".
    const { analysis } = useAthleteWorkoutAnalysis(treinoRegistrado?.id ?? null);
    const analysisView = useMemo(() => (analysis ? buildWorkoutAnalysisView(analysis) : null), [analysis]);
    const [treinoImportado, setTreinoImportado] = useState<TreinoRealizadoDto | null>(null);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        fetchRecentes();
        fetchCalibracao();
    }, [fetchRecentes, fetchCalibracao]);

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

    const handleFitUpload = useCallback(async (arquivo: File) => {
        try {
            const treino = await upload(arquivo);
            setTreinoImportado(treino);
            await fetchRecentes();
        } catch (err) {
            setToast({
                open: true,
                message: err instanceof Error ? err.message : 'Erro ao importar arquivo .fit.',
                severity: 'error',
            });
        }
    }, [upload, fetchRecentes]);

    const handleImportarOutro = useCallback(() => {
        setTreinoImportado(null);
        resetFitUpload();
    }, [resetFitUpload]);

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
                    }}
                >
                    Registrar treino
                </Typography>
                <Typography sx={{ color: surface[400], fontSize: '0.85rem', mt: 0.5 }}>
                    Registre um treino realizado nos últimos 7 dias.
                </Typography>
            </Box>

            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                <Typography sx={{ color: surface[50], fontSize: '0.95rem', fontWeight: 700, mb: 1.5 }}>
                    Importar de dispositivo (.fit)
                </Typography>
                {treinoImportado ? (
                    <FitUploadResultCard
                        treino={treinoImportado}
                        onImportarOutro={handleImportarOutro}
                        onVoltar={() => navigate(ROUTES.ATHLETE_HOME)}
                    />
                ) : (
                    <FileUploadZone onFileSelected={handleFitUpload} disabled={uploading} />
                )}
                {uploading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                        <CircularProgress size={20} sx={{ color: primary[500] }} />
                    </Box>
                )}
            </Box>

            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                {treinoRegistrado ? (
                    <PostWorkoutFeedbackCard
                        treino={treinoRegistrado}
                        onVoltar={() => navigate(ROUTES.ATHLETE_HOME)}
                        analysisView={analysisView}
                    />
                ) : (
                    <ManualTrainingForm
                        loading={isSubmitting}
                        hasTreinoHoje={hasTreinoHoje}
                        emCalibracao={Boolean(calibracaoStatus)}
                        initial={initial}
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
