import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Snackbar, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { OnboardingPerfilStep } from '../components/OnboardingPerfilStep';
import { OnboardingObjetivoStep } from '../components/OnboardingObjetivoStep';
import { OnboardingDisponibilidadeStep } from '../components/OnboardingDisponibilidadeStep';
import { OnboardingSaudeStep } from '../components/OnboardingSaudeStep';
import { OnboardingProvaAlvoStep } from '../components/OnboardingProvaAlvoStep';
import type { OnboardingConclusaoInput, OnboardingDraftInput } from '../../../types/Onboarding';
import { surface, glassSx, primary, backgrounds } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { ROUTES } from '../../../constants/routes';

interface StepContext {
    draft: OnboardingDraftInput;
    onDraftChange: (patch: Partial<OnboardingDraftInput>) => void;
    prova: Partial<OnboardingConclusaoInput>;
    onProvaChange: (patch: Partial<OnboardingConclusaoInput>) => void;
}

interface OnboardingStepDef {
    label: string;
    isValid: (ctx: StepContext) => boolean;
    render: (ctx: StepContext) => ReactNode;
}

/**
 * Fonte única para rótulo/validação/conteúdo de cada etapa (correção QA 2026-07-22, achado do
 * clean-code-reviewer) — antes `STEP_LABELS` e o `switch` de validação eram mantidos em sincronia
 * manual pelo índice, um risco real de bug ao reordenar/adicionar etapa.
 */
const STEPS: OnboardingStepDef[] = [
    {
        label: 'Perfil',
        isValid: ({ draft }) => Boolean(draft.nivelExperiencia && draft.dispositivoMarca && draft.canalIntegracao),
        render: ({ draft, onDraftChange }) => <OnboardingPerfilStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Objetivo',
        isValid: ({ draft }) => Boolean(draft.objetivo && draft.objetivo.trim().length > 0),
        render: ({ draft, onDraftChange }) => <OnboardingObjetivoStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Disponibilidade',
        isValid: ({ draft }) => Boolean(
            draft.diasDisponiveis && draft.diasDisponiveis.length > 0
            && draft.duracaoDisponivelMin != null && draft.volumeSemanalMax != null
        ),
        render: ({ draft, onDraftChange }) => <OnboardingDisponibilidadeStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Saúde',
        isValid: ({ draft }) => draft.temLesao !== undefined && (!draft.temLesao || Boolean(draft.descricaoLesao)),
        render: ({ draft, onDraftChange }) => <OnboardingSaudeStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Prova alvo',
        isValid: ({ prova }) => Boolean(prova.dataProva && prova.tipoProva && prova.distancia),
        render: ({ prova, onProvaChange }) => <OnboardingProvaAlvoStep value={prova} onChange={onProvaChange} />,
    },
];

export default function AthleteOnboardingPage() {
    const navigate = useNavigate();
    const { draft, loading, saving, fetchError, fetchDraft, updateDraft, saveDraft, concluir } = useOnboarding();
    const [activeStep, setActiveStep] = useState(0);
    const [prova, setProva] = useState<Partial<OnboardingConclusaoInput>>({});
    const [concluido, setConcluido] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    useEffect(() => {
        fetchDraft();
    }, [fetchDraft]);

    const onProvaChange = useCallback((patch: Partial<OnboardingConclusaoInput>) => {
        setProva((prev) => ({ ...prev, ...patch }));
    }, []);

    const stepContext: StepContext = { draft, onDraftChange: updateDraft, prova, onProvaChange };
    const isLastStep = activeStep === STEPS.length - 1;
    const isStepValid = STEPS[activeStep].isValid(stepContext);

    const handleNext = useCallback(async () => {
        if (!isStepValid) return;
        try {
            await saveDraft();
            setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
        } catch {
            setToast({ open: true, message: 'Erro ao salvar seu progresso. Tente novamente.' });
        }
    }, [isStepValid, saveDraft]);

    const handleBack = useCallback(() => {
        setActiveStep((s) => Math.max(s - 1, 0));
    }, []);

    const handleConcluir = useCallback(async () => {
        if (!isStepValid || !prova.dataProva || !prova.tipoProva || !prova.distancia) return;
        try {
            await concluir({
                dataProva: prova.dataProva,
                tipoProva: prova.tipoProva,
                distancia: prova.distancia,
                distanciaKm: prova.distanciaKm,
                nomeProva: prova.nomeProva,
            });
            setConcluido(true);
        } catch {
            setToast({ open: true, message: 'Erro ao concluir o onboarding. Tente novamente.' });
        }
    }, [isStepValid, prova, concluir]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: primary[500] }} />
            </Box>
        );
    }

    if (fetchError) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Erro ao carregar o onboarding. Tente novamente.</Alert>
            </Box>
        );
    }

    if (concluido) {
        return (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ ...glassSx, borderRadius: 2, p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: surface[50], fontSize: '1.2rem', fontWeight: 800, mb: 1 }}>
                        Onboarding concluído!
                    </Typography>
                    <Typography sx={{ color: surface[400], fontSize: '0.9rem', mb: 2 }}>
                        Seu perfil foi salvo e já estamos calculando seu plano de treino.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate(ROUTES.ATHLETE_HOME)}
                        sx={{ bgcolor: primary[500], color: backgrounds.canvas, fontWeight: 700 }}
                    >
                        Ir para Home
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <Typography sx={{ color: surface[50], fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>
                    Vamos te conhecer melhor
                </Typography>
                <Typography sx={{ color: surface[400], fontSize: '0.85rem', mt: 0.5 }}>
                    Suas respostas moldam o seu plano de treino. Você pode salvar e voltar depois.
                </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{
                '& .MuiStepLabel-label': { color: surface[400] },
                '& .MuiStepLabel-label.Mui-active': { color: surface[50], fontWeight: 700 },
                '& .MuiStepLabel-label.Mui-completed': { color: surface[300] },
                '& .MuiStepIcon-root': { color: surface[700] },
                '& .MuiStepIcon-root.Mui-active': { color: primary[500] },
                '& .MuiStepIcon-root.Mui-completed': { color: primary[600] },
            }}>
                {STEPS.map((step) => (
                    <Step key={step.label}>
                        <StepLabel>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                {STEPS[activeStep].render(stepContext)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0 || saving}
                    sx={{ color: surface[300] }}
                >
                    Voltar
                </Button>
                {!isLastStep ? (
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        disabled={!isStepValid || saving}
                        sx={{ bgcolor: primary[500], color: backgrounds.canvas, fontWeight: 700, '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] } }}
                    >
                        {saving ? 'Salvando...' : 'Avançar'}
                    </Button>
                ) : (
                    <Button
                        onClick={handleConcluir}
                        variant="contained"
                        disabled={!isStepValid || saving}
                        sx={{ bgcolor: primary[500], color: backgrounds.canvas, fontWeight: 700, '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] } }}
                    >
                        {saving ? 'Concluindo...' : 'Concluir'}
                    </Button>
                )}
            </Box>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ open: false, message: '' })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setToast({ open: false, message: '' })} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
