import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Alert, Box, Button, CircularProgress, LinearProgress, Snackbar, Step, StepLabel, Stepper, Typography,
    useMediaQuery, useTheme,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { OnboardingSobreVoceStep } from '../components/OnboardingSobreVoceStep';
import { OnboardingRotinaStep } from '../components/OnboardingRotinaStep';
import { OnboardingSaudeStep } from '../components/OnboardingSaudeStep';
import { OnboardingRelogioStep } from '../components/OnboardingRelogioStep';
import { OnboardingProvaAlvoStep } from '../components/OnboardingProvaAlvoStep';
import {
    buildOnboardingConclusao, faltaNaProvaAlvo, isProvaAlvoRespondida, type ProvaAlvoForm,
} from '../adapters/onboardingProvaAdapter';
import type { OnboardingDraftInput } from '../../../types/Onboarding';
import { NIVEL_EXPERIENCIA_LABELS, DIA_SEMANA_LABELS } from '../../../types/Atleta';
import { DISTANCIA_PROVA_LABELS } from '../../../types/Prova';
import { surface, glassSx, primary, backgrounds } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { ROUTES } from '../../../constants/routes';

interface StepContext {
    draft: OnboardingDraftInput;
    onDraftChange: (patch: Partial<OnboardingDraftInput>) => void;
    prova: ProvaAlvoForm;
    onProvaChange: (patch: Partial<ProvaAlvoForm>) => void;
}

interface OnboardingStepDef {
    label: string;
    /** O que ainda falta para avançar, em linguagem da tela. Vazio = pode avançar. */
    falta: (ctx: StepContext) => string[];
    /** Etapa sem campo obrigatório: o botão vira "Pular" enquanto nada foi respondido. */
    opcional?: boolean;
    vazia?: (ctx: StepContext) => boolean;
    render: (ctx: StepContext) => ReactNode;
}

/**
 * Fonte única para rótulo/validação/conteúdo de cada etapa (correção QA 2026-07-22, achado do
 * clean-code-reviewer) — antes `STEP_LABELS` e o `switch` de validação eram mantidos em sincronia
 * manual pelo índice, um risco real de bug ao reordenar/adicionar etapa.
 *
 * Ordem e obrigatoriedade revistas em improve-athlete-onboarding-usability: o atleta fala de si
 * primeiro, relógio vai para o fim, e só fica obrigatório o que o motor de plano ou o backend de
 * fato exigem — nível, objetivo, dias (bloqueiam a geração do plano) e marca do relógio (D7).
 * Duração por sessão e volume semanal saíram do formulário (decisão 2026-10-23).
 */
const STEPS: OnboardingStepDef[] = [
    {
        label: 'Você',
        falta: ({ draft }) => [
            ...(draft.nivelExperiencia ? [] : ['há quanto tempo você corre']),
            ...(draft.objetivo?.trim() ? [] : ['seu objetivo']),
        ],
        render: ({ draft, onDraftChange }) => <OnboardingSobreVoceStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Rotina',
        falta: ({ draft }) => (draft.diasDisponiveis && draft.diasDisponiveis.length > 0 ? [] : ['pelo menos um dia da semana']),
        render: ({ draft, onDraftChange }) => <OnboardingRotinaStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Saúde',
        opcional: true,
        vazia: ({ draft }) => draft.temLesao === undefined && !draft.historicoLesoes?.trim(),
        falta: ({ draft }) => (draft.temLesao && !draft.descricaoLesao?.trim() ? ['descrever a lesão'] : []),
        render: ({ draft, onDraftChange }) => <OnboardingSaudeStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Relógio',
        falta: ({ draft }) => (draft.dispositivoMarca ? [] : ['qual relógio ou app você usa']),
        render: ({ draft, onDraftChange }) => <OnboardingRelogioStep draft={draft} onChange={onDraftChange} />,
    },
    {
        label: 'Prova',
        falta: ({ prova }) => faltaNaProvaAlvo(prova),
        render: ({ prova, onProvaChange }) => <OnboardingProvaAlvoStep value={prova} onChange={onProvaChange} />,
    },
];

function listarFalta(falta: string[]): string {
    if (falta.length <= 1) return falta.join('');
    return `${falta.slice(0, -1).join(', ')} e ${falta[falta.length - 1]}`;
}

export default function AthleteOnboardingPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const telaEstreita = useMediaQuery(theme.breakpoints.down('sm'));
    // Presente só na rota do coach (`/coach/athletes/:atletaId/onboarding`, coach-como-proxy,
    // athlete-onboarding-baseline CA7) — ausente na rota do próprio atleta (`/athlete/onboarding`).
    const { atletaId: atletaIdDaUrl } = useParams<{ atletaId?: string }>();
    const emContextoDeCoach = Boolean(atletaIdDaUrl);
    const { draft, loading, saving, fetchError, fetchDraft, updateDraft, saveDraft, concluir } = useOnboarding(atletaIdDaUrl);
    const [activeStep, setActiveStep] = useState(0);
    const [prova, setProva] = useState<ProvaAlvoForm>({});
    const [concluido, setConcluido] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    useEffect(() => {
        fetchDraft();
    }, [fetchDraft]);

    const onProvaChange = useCallback((patch: Partial<ProvaAlvoForm>) => {
        setProva((prev) => ({ ...prev, ...patch }));
    }, []);

    const stepContext: StepContext = { draft, onDraftChange: updateDraft, prova, onProvaChange };
    const step = STEPS[activeStep];
    const isLastStep = activeStep === STEPS.length - 1;
    const falta = step.falta(stepContext);
    const isStepValid = falta.length === 0;
    const etapaVazia = step.opcional === true && (step.vazia?.(stepContext) ?? false);

    const handleNext = useCallback(async () => {
        if (!isStepValid) return;
        try {
            await saveDraft();
            setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
        } catch {
            setToast({ open: true, message: 'Erro ao salvar seu progresso. Tente novamente.' });
        }
    }, [isStepValid, saveDraft]);

    // Voltar também salva: "você pode salvar e voltar depois" só valia para quem avançava — quem
    // voltava para corrigir algo e saía do app perdia o que tinha respondido na etapa atual.
    const handleBack = useCallback(async () => {
        try {
            await saveDraft();
        } catch {
            setToast({ open: true, message: 'Não foi possível salvar esta etapa; suas respostas anteriores estão guardadas.' });
        }
        setActiveStep((s) => Math.max(s - 1, 0));
    }, [saveDraft]);

    const handleConcluir = useCallback(async () => {
        if (!isProvaAlvoRespondida(prova)) return;
        try {
            await concluir(buildOnboardingConclusao(prova));
            setConcluido(true);
        } catch {
            setToast({ open: true, message: 'Erro ao concluir o onboarding. Tente novamente.' });
        }
    }, [prova, concluir]);

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
            <ConclusaoOnboarding
                draft={draft}
                prova={prova}
                emContextoDeCoach={emContextoDeCoach}
                onVoltar={() => navigate(emContextoDeCoach ? `/coach/athletes/${atletaIdDaUrl}` : ROUTES.ATHLETE_HOME)}
            />
        );
    }

    return (
        <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <Typography variant="h5" sx={{ color: surface[50] }}>
                    Vamos te conhecer melhor
                </Typography>
                <Typography sx={{ color: surface[400], fontSize: '0.85rem', mt: 0.5 }}>
                    Cinco passos rápidos. Suas respostas ficam salvas a cada passo — pode parar e voltar depois.
                </Typography>
            </Box>

            {telaEstreita ? (
                /*
                  Em 390px o Stepper horizontal cortava os passos 4 e 5 sem indicar que havia mais.
                  "Passo N de 5" + barra diz onde o atleta está e quanto falta, no espaço de uma linha.
                */
                <Box data-testid="onboarding-progresso-compacto">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                        <Typography sx={{ color: surface[50], fontWeight: 700, fontSize: '0.95rem' }}>{step.label}</Typography>
                        <Typography sx={{ color: surface[400], fontSize: '0.8rem' }}>Passo {activeStep + 1} de {STEPS.length}</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={((activeStep + 1) / STEPS.length) * 100}
                        aria-label={`Passo ${activeStep + 1} de ${STEPS.length}`}
                        sx={{ height: 6, borderRadius: 999, bgcolor: surface[700], '& .MuiLinearProgress-bar': { bgcolor: primary[500], borderRadius: 999 } }}
                    />
                </Box>
            ) : (
                <Stepper activeStep={activeStep} sx={{
                    '& .MuiStepLabel-label': { color: surface[400] },
                    '& .MuiStepLabel-label.Mui-active': { color: surface[50], fontWeight: 700 },
                    '& .MuiStepLabel-label.Mui-completed': { color: surface[300] },
                    '& .MuiStepIcon-root': { color: surface[700] },
                    '& .MuiStepIcon-root.Mui-active': { color: primary[500] },
                    '& .MuiStepIcon-root.Mui-completed': { color: primary[600] },
                }}>
                    {STEPS.map((s) => (
                        <Step key={s.label}>
                            <StepLabel>{s.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            )}

            <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5 }}>
                {step.render(stepContext)}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                            variant={etapaVazia ? 'outlined' : 'contained'}
                            disabled={!isStepValid || saving}
                            sx={etapaVazia
                                ? { color: surface[200], borderColor: surface[600], fontWeight: 700 }
                                : { bgcolor: primary[500], color: backgrounds.canvas, fontWeight: 700, '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] } }}
                        >
                            {saving ? 'Salvando...' : etapaVazia ? 'Pular' : 'Avançar'}
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
                {/* O botão desabilitado sem explicação era o achado nº 1 do percurso: o atleta clicava e nada acontecia. */}
                {!isStepValid && (
                    <Typography data-testid="onboarding-falta" sx={{ color: surface[400], fontSize: '0.78rem', textAlign: 'right' }}>
                        Falta: {listarFalta(falta)}.
                    </Typography>
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

// ── Tela de conclusão ─────────────────────────────────────────────────────────

interface ConclusaoOnboardingProps {
    draft: OnboardingDraftInput;
    prova: ProvaAlvoForm;
    emContextoDeCoach: boolean;
    onVoltar: () => void;
}

/**
 * Resumo do que foi respondido + próximo passo honesto. A tela anterior dizia "já estamos
 * calculando seu plano" — quem monta o plano é o treinador, e a promessa não se cumpria.
 */
function ConclusaoOnboarding({ draft, prova, emContextoDeCoach, onVoltar }: ConclusaoOnboardingProps) {
    const dias = (draft.diasDisponiveis ?? []).map((d) => DIA_SEMANA_LABELS[d]).join(', ');
    const provaResumo = prova.temProva && prova.distancia
        ? `${DISTANCIA_PROVA_LABELS[prova.distancia]}${prova.dataProva ? ` em ${formatarData(prova.dataProva)}` : ''}`
        : 'Nenhuma por enquanto';

    const linhas: Array<[string, string]> = [
        ['Experiência', draft.nivelExperiencia ? NIVEL_EXPERIENCIA_LABELS[draft.nivelExperiencia] : '—'],
        ['Objetivo', draft.objetivo?.trim() || '—'],
        ['Dias de treino', dias || '—'],
        ['Prova alvo', provaResumo],
    ];

    return (
        <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ ...glassSx, borderRadius: 2, p: 3 }}>
                <Typography sx={{ color: surface[50], fontSize: '1.2rem', fontWeight: 800, mb: 0.5 }}>
                    Perfil enviado!
                </Typography>
                <Typography sx={{ color: surface[400], fontSize: '0.9rem', mb: 2.5 }}>
                    {emContextoDeCoach
                        ? 'As respostas já estão no perfil do atleta para você montar o plano.'
                        : 'Seu treinador vai usar essas respostas para montar um plano do seu tamanho. Você pode ajustar tudo depois no seu perfil.'}
                </Typography>

                <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1 }}>
                    {linhas.map(([rotulo, valor]) => (
                        <Box key={rotulo} sx={{ display: 'contents' }}>
                            <Typography component="dt" sx={{ color: surface[400], fontSize: '0.8rem' }}>{rotulo}</Typography>
                            <Typography component="dd" sx={{ m: 0, color: surface[50], fontSize: '0.85rem', fontWeight: 600 }}>{valor}</Typography>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={onVoltar}
                        sx={{ bgcolor: primary[500], color: backgrounds.canvas, fontWeight: 700 }}
                    >
                        {emContextoDeCoach ? 'Voltar ao perfil do atleta' : 'Ir para Home'}
                    </Button>
                    {!emContextoDeCoach && !prova.temProva && (
                        <Button component={RouterLink} to={ROUTES.ATHLETE_RACE_NEW} variant="text" sx={{ color: surface[200], fontWeight: 600 }}>
                            Cadastrar uma prova
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`, sem passar por `Date` (que deslocaria o dia pelo fuso). */
function formatarData(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}
