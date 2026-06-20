import { lazy, Suspense, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { parseISO } from 'date-fns';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Skeleton,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { PMCDataPoint, PMCRange } from '../../athlete/components/PMCChart';

const PMCChart = lazy(() => import('../../athlete/components/PMCChart'));
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { AdherenceChart } from '../components/AdherenceChart';
import { CurrentWeekPlan } from '../components/CurrentWeekPlan';
import { RecentSignalsPanel } from '../components/RecentSignalsPanel';
import { RecentSuggestionsPanel } from '../components/RecentSuggestionsPanel';
import { useAthleteProfile } from '../../../hooks/useAthleteProfile';
import { surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: '100%',
                borderRadius: 2,
                border: `1px solid ${surface[0]}1A`,
            }}
        >
            <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: surface[400], textTransform: 'uppercase', letterSpacing: 1 }}
            >
                {title}
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: `${surface[0]}12` }} />
            {children}
        </Paper>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CoachAthleteProfilePage() {
    const { atletaId } = useParams<{ atletaId: string }>();
    const navigate = useNavigate();
    const [pmcRange, setPmcRange] = useState<PMCRange>('12w');

    const { profile, isLoading, error, errorKind, fetchProfile } = useAthleteProfile(atletaId);

    const pmcData: PMCDataPoint[] = useMemo(
        () =>
            (profile?.pmc ?? []).map((p) => ({
                date: parseISO(p.data),
                ctl: p.ctl,
                atl: p.atl,
                tsb: p.tsb,
                tss: p.tss,
            })),
        [profile?.pmc],
    );

    if (!atletaId) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">ID do atleta ausente na URL</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100%',
                bgcolor: elevation.base,
                p: { xs: 2, md: 3 },
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
            }}
        >
            {/* ── Navegação ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/coach/athletes')}
                    sx={{ color: surface[400], fontSize: '0.8rem' }}
                >
                    Roster
                </Button>
            </Box>

            {/* ── Header do atleta ── */}
            {isLoading && !profile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box>
                        <Skeleton variant="text" width={200} height={28} />
                        <Skeleton variant="text" width={120} height={20} />
                    </Box>
                </Box>
            ) : profile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CoachAthleteAvatar
                        athlete={{ id: atletaId, name: profile.nomeAtleta }}
                        size="md"
                        status="none"
                    />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: surface[50] }}>
                            {profile.nomeAtleta}
                        </Typography>
                        <Typography variant="body2" sx={{ color: surface[400] }}>
                            {profile.nivelExperiencia
                                ? profile.nivelExperiencia.replace(/_/g, ' ')
                                : 'Nível não informado'}
                            {profile.objetivo ? ` · ${profile.objetivo}` : ''}
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={() => fetchProfile()}
                            sx={{ color: surface[400] }}
                        >
                            Atualizar
                        </Button>
                    </Box>
                </Box>
            ) : null}

            {/* ── Erro ── */}
            {error && (
                <Alert
                    severity={errorKind === 'timeout' ? 'warning' : 'error'}
                    action={
                        <Button color="inherit" size="small" onClick={() => fetchProfile()}>
                            Tentar novamente
                        </Button>
                    }
                >
                    {errorKind === 'timeout'
                        ? 'O servidor demorou para responder. Tente novamente.'
                        : 'Não foi possível carregar o perfil do atleta.'}
                </Alert>
            )}

            {/* ── Avisos de falha parcial ── */}
            {profile?.avisos && profile.avisos.length > 0 && (
                <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                    Alguns blocos não carregaram: {profile.avisos.join(', ')}.
                </Alert>
            )}

            {/* ── Conteúdo ── */}
            {isLoading && !profile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : profile ? (
                <Grid container spacing={3}>
                    {/* PMC — largura total */}
                    <Grid size={12}>
                        <SectionCard title="Performance Management Chart">
                            <Suspense fallback={<Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>}>
                                <PMCChart
                                    data={pmcData}
                                    range={pmcRange}
                                    onRangeChange={setPmcRange}
                                />
                            </Suspense>
                        </SectionCard>
                    </Grid>

                    {/* Plano vigente — 8 colunas */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <SectionCard title="Plano da semana">
                            <CurrentWeekPlan
                                plano={profile.planoVigente}
                                onGerarPlano={() => navigate('/coach/inbox')}
                                onRevisarPlano={() => navigate('/coach/planos/revisao')}
                            />
                        </SectionCard>
                    </Grid>

                    {/* Aderência — 4 colunas */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <SectionCard title="Aderência (8 semanas)">
                            <AdherenceChart semanas={profile.aderenciaSemanal} />
                        </SectionCard>
                    </Grid>

                    {/* Sinais recentes — 6 colunas */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <SectionCard title="Sinais recentes">
                            <RecentSignalsPanel sinais={profile.sinaisRecentes} />
                        </SectionCard>
                    </Grid>

                    {/* Sugestões recentes — 6 colunas */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <SectionCard title="Sugestões recentes">
                            <RecentSuggestionsPanel
                                sugestoes={profile.sugestoesRecentes}
                                onVerTodas={() => navigate('/coach/inbox')}
                            />
                        </SectionCard>
                    </Grid>
                </Grid>
            ) : null}
        </Box>
    );
}
