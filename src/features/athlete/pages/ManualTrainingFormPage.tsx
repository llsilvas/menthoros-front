import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Snackbar, Typography } from '@mui/material';
import { isSameDay, parseISO } from 'date-fns';
import { surface, glassSx } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { useManualTraining } from '../../../hooks/useManualTraining';
import { ManualTrainingForm } from '../components/ManualTrainingForm';
import { RecentTrainingsList } from '../components/RecentTrainingsList';
import type { TreinoManualInput } from '../../../types/TreinoManual';

export default function ManualTrainingFormPage() {
    const { recentes, loading, registrar, fetchRecentes } = useManualTraining(7);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        fetchRecentes();
    }, [fetchRecentes]);

    const hoje = new Date();
    const hasTreinoHoje = recentes.some((t) => isSameDay(parseISO(t.dataTreino), hoje));

    const handleSubmit = useCallback(async (input: TreinoManualInput) => {
        try {
            await registrar(input);
            setToast({ open: true, message: 'Treino registrado com sucesso!', severity: 'success' });
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
            {/* Header */}
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

            {/* Formulário */}
            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                <ManualTrainingForm
                    loading={loading}
                    hasTreinoHoje={hasTreinoHoje}
                    onSubmit={handleSubmit}
                />
            </Box>

            {/* Treinos recentes */}
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
                <RecentTrainingsList treinos={recentes} />
            </Box>

            {/* Toast de confirmação */}
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
