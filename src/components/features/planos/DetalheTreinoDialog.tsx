import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    Card,
    CardContent,
    Stack,
    CircularProgress,
    useMediaQuery,
} from '@mui/material';
import {
    CloudSync as CloudSyncIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    Speed as SpeedIcon,
    AutoAwesome as AiIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoPlanejado, EtapaTreino } from '../../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber, getSafeLabel, getSafeColor } from '../../../utils/safeValues';
import { glass, text, primary, surface, semantic, categorical, content, external } from '../../../theme/tokens';
import { zones } from '../../../theme/activeTheme';
import { elevation } from '../../../shared/design-tokens';
import { WorkoutTimelineChart, toWorkoutBlocks } from './WorkoutTimelineChart';
import DecouplingBadge from './DecouplingBadge';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { effortColor } from '../../../shared/theme/workoutColors';

interface DetalheTreinoDialogProps {
    open: boolean;
    onClose: () => void;
    treino: TreinoPlanejado | null;
}

const formatDuration = (minutes?: number | null): string => {
    if (minutes == null || Number.isNaN(minutes)) return 'N/A';
    if (minutes <= 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
};

const formatDate = (date?: string | null): string | null => {
    if (!date) return null;
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
};

const getNumericValue = (value: unknown): number | null => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
};

const resolveStageMetric = (etapa: EtapaTreino): { label: string; value: string } | null => {
    if (etapa.fcAlvoEtapa) {
        return { label: 'FC alvo', value: etapa.fcAlvoEtapa };
    }

    if (etapa.repeticoes != null && etapa.repeticoes > 1) {
        return { label: 'Repetições', value: `${etapa.repeticoes}x` };
    }

    if (etapa.distanciaKm != null) {
        return { label: 'Distância', value: `${etapa.distanciaKm} km` };
    }

    return null;
};

const MetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    accent?: string;
}> = ({ icon, label, value, accent = categorical.cat1 }) => (
    <Box
        sx={{
            height: '100%',
            borderRadius: 1,
            border: `1px solid ${content.cardBorder}`,
            bgcolor: elevation.card,
            p: 1.75,
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(accent, 0.15),
                    color: accent,
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: surface[400], display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: surface[50], fontVariantNumeric: 'tabular-nums' }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    </Box>
);

const RpeScale: React.FC<{ value: number }> = ({ value }) => {
    return (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {Array.from({ length: 10 }, (_, i) => (
                <Box
                    key={i}
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 1,
                        bgcolor: i < value ? effortColor(value) : glass.background,
                    }}
                />
            ))}
            <Typography variant="caption" sx={{ ml: 1, fontWeight: 'bold' }}>
                {value}/10
            </Typography>
        </Box>
    );
};

const DetalheTreinoDialog: React.FC<DetalheTreinoDialogProps> = ({ open, onClose, treino }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [treinoCompleto, setTreinoCompleto] = useState<TreinoPlanejado | null>(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [enriching, setEnriching] = useState(false);
    const [enrichResult, setEnrichResult] = useState<{ rpePreenchido: boolean; rpe?: number } | null>(null);
    const [enrichError, setEnrichError] = useState<string | null>(null);
    const [decoupling, setDecoupling] = useState<number | null>(null);

    useEffect(() => {
        // Detalhe do realizado (decoupling) — busca best-effort; falha não quebra a tela.
        if (open && treino?.treinoRealizadoId) {
            TreinoService.obterRealizado(treino.treinoRealizadoId)
                .then((data) => setDecoupling(data.decouplingPercentual ?? null))
                .catch((err) => console.error('Erro ao carregar decoupling do treino:', err));
        }
    }, [open, treino]);

    useEffect(() => {
        if (open && treino?.id && (!treino.etapas || treino.etapas.length === 0)) {
            setLoadingDetalhes(true);
            TreinoService.obterTreino(treino.id)
                .then((data) => setTreinoCompleto(data))
                .catch((err) => console.error('Erro ao carregar detalhes do treino:', err))
                .finally(() => setLoadingDetalhes(false));
        } else if (treino) {
            setTreinoCompleto(treino);
        }
    }, [open, treino]);

    useEffect(() => {
        if (!open) {
            setTreinoCompleto(null);
            setEnrichResult(null);
            setEnrichError(null);
            setDecoupling(null);
        }
    }, [open]);

    if (!treino) return null;

    const dados = treinoCompleto || treino;
    const etapasOrdenadas = [...(dados.etapas || [])].sort(
        (a, b) => getSafeNumber(a.ordem) - getSafeNumber(b.ordem)
    );

    const statusLabel = getSafeLabel(dados.statusTreino);
    const statusColor = getSafeColor(dados.statusTreino, surface[400]);
    const diaSemanaLabel = getSafeLabel(dados.diaSemana);
    const fonteDadosLabel = getSafeLabel(dados.fonteDados);
    const fonteDadosValue = typeof dados.fonteDados === 'object' ? dados.fonteDados?.value : dados.fonteDados;
    const isStrava = fonteDadosValue === 'STRAVA';

    const handleEnriquecerComStrava = async () => {
        if (!dados.treinoRealizadoId) return;
        setEnriching(true);
        setEnrichResult(null);
        setEnrichError(null);
        try {
            const resultado = await TreinoService.enriquecerComStrava(dados.treinoRealizadoId);
            const rpe = resultado.percepcaoEsforco ?? undefined;
            setEnrichResult({ rpePreenchido: rpe != null, rpe });
            if (treinoCompleto) {
                setTreinoCompleto({ ...treinoCompleto, percepcaoEsforcoRealizado: rpe });
            }
        } catch {
            setEnrichError('Não foi possível buscar os detalhes do Strava. Tente novamente.');
        } finally {
            setEnriching(false);
        }
    };
    const intensidadePercent = dados.intensidadePlanejada
        ? `${Math.round(dados.intensidadePlanejada * 100)}%`
        : 'N/A';
    const blocks = toWorkoutBlocks(etapasOrdenadas);
    const totalDuration = getNumericValue(dados.duracaoMin) ?? blocks.reduce((total, block) => total + block.durationMin, 0);
    const dominantZoneKey = blocks.reduce<keyof typeof zones | null>((current, block) => {
        if (!current) return block.zoneKey;
        return block.zone > Number(current.replace('Z', '')) ? block.zoneKey : current;
    }, null);
    const dateLabel = formatDate(dados.dataTreino);
    const observacaoPrincipal = dados.observacao || dados.descricao;

    const detalheChips = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
                label={statusLabel}
                size="small"
                sx={{
                    bgcolor: statusColor,
                    color: surface[50],
                    fontWeight: 800,
                }}
            />
            {dominantZoneKey && (
                <Chip
                    label={`${dominantZoneKey} • ${zones[dominantZoneKey].label}`}
                    size="small"
                    sx={{
                        bgcolor: alpha(zones[dominantZoneKey].border, 0.14),
                        color: surface[200],
                        border: `1px solid ${alpha(zones[dominantZoneKey].border, 0.28)}`,
                        fontWeight: 700,
                    }}
                />
            )}
        </Box>
    );

    return (
        <CoachDialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            chip={detalheChips}
            title={String(getSafeValue(dados.tipoTreino))}
            subtitle="Visualização da estrutura do treino com foco em duração, carga e distribuição entre etapas."
            dividers
            contentSx={{ p: 0, background: elevation.base }}
            actionsHint={
                dados.tssPlanejado != null ? (
                    <Typography variant="caption" sx={{ color: surface[400] }}>
                        TSS planejado: <Box component="span" sx={{ fontWeight: 700, color: surface[50] }}>{dados.tssPlanejado}</Box>
                    </Typography>
                ) : null
            }
            actions={
                <Button onClick={onClose} size="small" variant="contained" fullWidth={isMobile} sx={{ ...PRIMARY_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                    Fechar
                </Button>
            }
        >
                {loadingDetalhes ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="320px">
                        <CircularProgress size={48} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Carregando detalhes do treino...
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2.5} sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Box
                            sx={{
                                borderRadius: 1,
                                border: `1px solid ${content.cardBorder}`,
                                bgcolor: elevation.card,
                                p: { xs: 2, md: 2.5 },
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: { xs: 'flex-start', md: 'flex-end' },
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: 'Syne, sans-serif',
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            color: surface[50],
                                        }}
                                    >
                                        Panorama do treino
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: surface[400] }}>
                                        Leitura rápida do contexto, intensidade e duração planejada.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        borderRadius: 1,
                                        border: `1px solid ${content.cardBorder}`,
                                        bgcolor: elevation.panel,
                                        px: 1.5,
                                        py: 1,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: surface[400], mr: 1 }}>
                                        Duração total
                                    </Typography>
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontFamily: 'Space Mono, monospace',
                                            fontWeight: 700,
                                            color: surface[50],
                                        }}
                                    >
                                        {formatDuration(totalDuration)}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                <Chip
                                    label={diaSemanaLabel}
                                    size="small"
                                    sx={{
                                        bgcolor: `${categorical.cat1}26`,
                                        color: categorical.cat1,
                                        fontWeight: 700,
                                    }}
                                />
                                {dateLabel && (
                                    <Chip
                                        icon={<CalendarIcon sx={{ fontSize: '0.9rem !important' }} />}
                                        label={dateLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: elevation.panel,
                                            color: surface[400],
                                        }}
                                    />
                                )}
                                {fonteDadosLabel && (
                                    <Chip
                                        label={fonteDadosLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(getSafeColor(dados.fonteDados, surface[500]), 0.12),
                                            color: getSafeColor(dados.fonteDados, surface[500]),
                                            fontWeight: 700,
                                        }}
                                    />
                                )}
                                {isStrava && dados.treinoRealizadoId && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={enriching
                                            ? <CircularProgress size={14} />
                                            : <CloudSyncIcon fontSize="small" />}
                                        onClick={handleEnriquecerComStrava}
                                        disabled={enriching}
                                        sx={{
                                            borderColor: external.strava,
                                            color: external.strava,
                                            fontSize: '0.75rem',
                                            py: 0.25,
                                            '&:hover': { bgcolor: alpha(external.strava, 0.06), borderColor: external.strava },
                                        }}
                                    >
                                        {enriching ? 'Buscando…' : 'Detalhes do Strava'}
                                    </Button>
                                )}
                            </Box>

                            {enrichResult && (
                                <Alert
                                    severity={enrichResult.rpePreenchido ? 'success' : 'info'}
                                    sx={{ mb: 1.5 }}
                                    onClose={() => setEnrichResult(null)}
                                >
                                    {enrichResult.rpePreenchido
                                        ? `RPE preenchido automaticamente com dados do Strava: ${enrichResult.rpe}/10. Análise AI será gerada em breve.`
                                        : 'Detalhes do Strava carregados. O Strava não registrou perceived_exertion para este treino.'}
                                </Alert>
                            )}
                            {enrichError && (
                                <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setEnrichError(null)}>
                                    {enrichError}
                                </Alert>
                            )}

                            {dados.treinoRealizadoId && (
                                <Box sx={{ mb: 1.5 }}>
                                    <DecouplingBadge value={decoupling} />
                                </Box>
                            )}

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<RunIcon fontSize="small" />}
                                        label="Distância"
                                        value={`${getSafeNumber(dados.distanciaKm)} km`}
                                        accent={categorical.cat1}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<ScheduleIcon fontSize="small" />}
                                        label="Duração"
                                        value={formatDuration(getNumericValue(dados.duracaoMin))}
                                        accent={categorical.cat6}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<SpeedIcon fontSize="small" />}
                                        label="Ritmo alvo"
                                        value={String(getSafeValue(dados.ritmoAlvo) || 'N/A')}
                                        accent={semantic.warning[500]}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<TrendingUpIcon fontSize="small" />}
                                        label="Intensidade"
                                        value={intensidadePercent}
                                        accent={primary[500]}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, lg: 8 }}>
                                <Stack spacing={2}>
                                    {dados.justificativaIa && (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: `${primary[500]}33`,
                                                bgcolor: `${primary[500]}0A`,
                                                boxShadow: 'none',
                                            }}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <AiIcon sx={{ color: primary[500] }} />
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            color: surface[400],
                                                        }}
                                                    >
                                                        Insight da IA
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: surface[50], lineHeight: 1.6 }}>
                                                    {dados.justificativaIa}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {blocks.length > 0 && (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: content.cardBorder,
                                                bgcolor: elevation.card,
                                                overflow: 'hidden',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.08em',
                                                            color: surface[400],
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        Visual principal
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Syne, sans-serif',
                                                            fontSize: '1.05rem',
                                                            fontWeight: 800,
                                                            color: surface[50],
                                                        }}
                                                    >
                                                        Timeline do treino
                                                    </Typography>
                                                </Box>

                                                <WorkoutTimelineChart
                                                    blocks={blocks}
                                                    title="Etapas por duração e zona"
                                                />

                                                <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Box
                                                            sx={{
                                                                borderRadius: 1,
                                                                border: `1px solid ${content.cardBorder}`,
                                                                bgcolor: elevation.panel,
                                                                p: 1.5,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    color: surface[400],
                                                                    mb: 0.75,
                                                                }}
                                                            >
                                                                Leitura rápida
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: surface[50], lineHeight: 1.6 }}>
                                                                A composição destaca a progressão do treino e facilita comparar
                                                                duração entre aquecimento, bloco principal e encerramento.
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Box
                                                            sx={{
                                                                borderRadius: 1,
                                                                border: `1px solid ${content.cardBorder}`,
                                                                bgcolor: elevation.panel,
                                                                p: 1.5,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    color: surface[400],
                                                                    mb: 0.75,
                                                                }}
                                                            >
                                                                Resumo estrutural
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: surface[50], lineHeight: 1.6 }}>
                                                                {blocks.length} bloco(s) planejado(s) com duração total de{' '}
                                                                <Box component="span" sx={{ fontWeight: 800, color: primary[500] }}>
                                                                    {formatDuration(totalDuration)}
                                                                </Box>
                                                                .
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {observacaoPrincipal && (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: content.cardBorder,
                                                bgcolor: elevation.card,
                                                boxShadow: 'none',
                                            }}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.78rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: surface[400],
                                                        mb: 1,
                                                    }}
                                                >
                                                    Observações
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: surface[50], lineHeight: 1.7 }}>
                                                    {observacaoPrincipal}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    )}
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, lg: 4 }}>
                                <Stack spacing={2}>
                                    {dados.percepcaoEsforcoEsperada != null && (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: content.cardBorder,
                                                bgcolor: elevation.card,
                                                boxShadow: 'none',
                                            }}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: surface[400],
                                                        mb: 1,
                                                    }}
                                                >
                                                    PSE esperado
                                                </Typography>
                                                <RpeScale value={dados.percepcaoEsforcoEsperada} />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {blocks.length > 0 && (
                                        <>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 1,
                                                    borderColor: content.cardBorder,
                                                    bgcolor: elevation.card,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                <CardContent sx={{ p: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.72rem',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                color: surface[400],
                                                            }}
                                                        >
                                                            Blocos
                                                        </Typography>
                                                        <Chip
                                                            label="Resumo"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(categorical.cat1, 0.14),
                                                                color: categorical.cat1,
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </Box>

                                                    <Stack spacing={1}>
                                                        {etapasOrdenadas.map((etapa, index) => {
                                                            const block = blocks[index];
                                                            const metric = resolveStageMetric(etapa);
                                                            const stageColor = block ? zones[block.zoneKey].border : getSafeColor(etapa.tipoEtapa, categorical.cat1);

                                                            return (
                                                                <Box
                                                                    key={etapa.id ?? `etapa-card-${index}`}
                                                                    sx={{
                                                                        border: `1px solid `,
                                                                        borderLeft: `3px solid ${stageColor}`,
                                                                        borderRadius: 1,
                                                                        bgcolor: alpha(stageColor, 0.06),
                                                                        p: 1.5,
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                                                                        <Box sx={{ minWidth: 0 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: surface[50] }}>
                                                                                {getSafeLabel(etapa.tipoEtapa)}
                                                                            </Typography>
                                                                            {etapa.descricaoEtapa && (
                                                                                <Typography variant="caption" sx={{ color: surface[400], display: 'block', mt: 0.25 }}>
                                                                                    {etapa.descricaoEtapa}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        <Chip
                                                                            label={formatDuration(etapa.duracaoMin)}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: alpha(stageColor, 0.12),
                                                                                color: text.primary,
                                                                                fontWeight: 700,
                                                                                flexShrink: 0,
                                                                            }}
                                                                        />
                                                                    </Box>

                                                                    {metric && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                            <Typography variant="caption" sx={{ color: surface[400] }}>
                                                                                {metric.label}
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="caption"
                                                                                sx={{
                                                                                    fontFamily: 'Space Mono, monospace',
                                                                                    fontWeight: 700,
                                                                                    color: surface[50],
                                                                                }}
                                                                            >
                                                                                {metric.value}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                </CardContent>
                                            </Card>

                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 1,
                                                    borderColor: content.cardBorder,
                                                    bgcolor: elevation.card,
                                                    boxShadow: 'none',
                                                }}
                                            >
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.72rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            color: surface[400],
                                                            mb: 1.5,
                                                        }}
                                                    >
                                                        Distribuição
                                                    </Typography>

                                                    <Stack spacing={1.2}>
                                                        {blocks.map((block) => {
                                                            const pct = totalDuration > 0 ? Math.round((block.durationMin / totalDuration) * 100) : 0;
                                                            const zoneColor = zones[block.zoneKey].border;

                                                            return (
                                                                <Box key={`distribution-${block.id}`}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                        <Typography variant="caption" sx={{ color: surface[400] }}>
                                                                            {block.label}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontFamily: 'Space Mono, monospace',
                                                                                color: surface[400],
                                                                            }}
                                                                        >
                                                                            {pct}%
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ height: 6, borderRadius: 999, bgcolor: surface[700] }}>
                                                                        <Box
                                                                            sx={{
                                                                                width: `${pct}%`,
                                                                                height: '100%',
                                                                                borderRadius: 999,
                                                                                bgcolor: zoneColor,
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>
                    </Stack>
                )}
        </CoachDialog>
    );
};

export default DetalheTreinoDialog;
