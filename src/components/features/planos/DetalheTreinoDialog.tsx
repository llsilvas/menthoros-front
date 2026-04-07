import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    Chip,
    Grid,
    Card,
    CardContent,
    Stack,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    Speed as SpeedIcon,
    AutoAwesome as AiIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoPlanejado, EtapaTreino } from '../../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber, getSafeLabel, getSafeColor } from '../../../utils/safeValues';
import { glass, text, zones } from '../../../theme/tokens';
import { WorkoutTimelineChart, toWorkoutBlocks } from './WorkoutTimelineChart';

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
}> = ({ icon, label, value, accent = '#3498db' }) => (
    <Box
        sx={{
            height: '100%',
            borderRadius: 1,
            border: '1px solid #d1d5db',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
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
                    bgcolor: alpha(accent, 0.12),
                    color: accent,
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: '#6b7a8d', display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#1a2535' }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    </Box>
);

const RpeScale: React.FC<{ value: number }> = ({ value }) => {
    const getColor = (v: number): string => {
        if (v <= 3) return '#4caf50';
        if (v <= 6) return '#ff9800';
        if (v <= 8) return '#f44336';
        return '#b71c1c';
    };

    return (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {Array.from({ length: 10 }, (_, i) => (
                <Box
                    key={i}
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 1,
                        bgcolor: i < value ? getColor(value) : glass.background,
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
    const [treinoCompleto, setTreinoCompleto] = useState<TreinoPlanejado | null>(null);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);

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
        }
    }, [open]);

    if (!treino) return null;

    const dados = treinoCompleto || treino;
    const etapasOrdenadas = [...(dados.etapas || [])].sort(
        (a, b) => getSafeNumber(a.ordem) - getSafeNumber(b.ordem)
    );

    const statusLabel = getSafeLabel(dados.statusTreino);
    const statusColor = getSafeColor(dados.statusTreino, '#9E9E9E');
    const diaSemanaLabel = getSafeLabel(dados.diaSemana);
    const fonteDadosLabel = getSafeLabel(dados.fonteDados);
    const intensidadePercent = dados.intensidadePlanejada
        ? `${Math.round(dados.intensidadePlanejada * 100)}%`
        : 'N/A';
    const blocks = toWorkoutBlocks(etapasOrdenadas);
    const totalDuration = dados.duracaoMin ?? blocks.reduce((total, block) => total + block.durationMin, 0);
    const dominantZoneKey = blocks.reduce<keyof typeof zones | null>((current, block) => {
        if (!current) return block.zoneKey;
        return block.zone > Number(current.replace('Z', '')) ? block.zoneKey : current;
    }, null);
    const dateLabel = formatDate(dados.dataTreino);
    const observacaoPrincipal = dados.observacao || dados.descricao;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        overflow: 'hidden',
                        borderRadius: 1,
                        backgroundColor: '#ffffff',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    px: 3,
                    py: 2.25,
                    pr: 8,
                    color: 'white',
                    background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                                bgcolor: statusColor,
                                color: 'white',
                                fontWeight: 800,
                            }}
                        />
                        {dominantZoneKey && (
                            <Chip
                                label={`${dominantZoneKey} • ${zones[dominantZoneKey].label}`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(zones[dominantZoneKey].border, 0.14),
                                    color: '#e8eaed',
                                    border: `1px solid ${alpha(zones[dominantZoneKey].border, 0.28)}`,
                                    fontWeight: 700,
                                }}
                            />
                        )}
                    </Box>

                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 800,
                            lineHeight: 1.15,
                            pr: 2,
                        }}
                    >
                        {getSafeValue(dados.tipoTreino)}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 0.75,
                            color: 'rgba(232, 234, 237, 0.72)',
                            maxWidth: 720,
                        }}
                    >
                        Visualização da estrutura do treino com foco em duração, carga e distribuição entre etapas.
                    </Typography>
                </Box>

                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.12)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    p: 0,
                    background:
                        'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
                }}
            >
                {loadingDetalhes ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="320px">
                        <CircularProgress size={48} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Carregando detalhes do treino...
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
                        <Box
                            sx={{
                                borderRadius: 1,
                                border: '1px solid rgba(255,255,255,0.7)',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)',
                                boxShadow: 'none',
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
                                            color: '#1a2535',
                                        }}
                                    >
                                        Panorama do treino
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: '#6b7a8d' }}>
                                        Leitura rápida do contexto, intensidade e duração planejada.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        borderRadius: 1,
                                        border: '1px solid #d1d5db',
                                        bgcolor: 'white',
                                        px: 1.5,
                                        py: 1,
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: '#6b7a8d', mr: 1 }}>
                                        Duração total
                                    </Typography>
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontFamily: 'Space Mono, monospace',
                                            fontWeight: 700,
                                            color: '#1a2535',
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
                                        bgcolor: alpha('#3498db', 0.1),
                                        color: '#1a5f8a',
                                        fontWeight: 700,
                                    }}
                                />
                                {dateLabel && (
                                    <Chip
                                        icon={<CalendarIcon sx={{ fontSize: '0.9rem !important' }} />}
                                        label={dateLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(15, 23, 42, 0.04)',
                                            color: '#475569',
                                        }}
                                    />
                                )}
                                {fonteDadosLabel && (
                                    <Chip
                                        label={fonteDadosLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(getSafeColor(dados.fonteDados, '#64748b'), 0.12),
                                            color: getSafeColor(dados.fonteDados, '#64748b'),
                                            fontWeight: 700,
                                        }}
                                    />
                                )}
                            </Box>

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<RunIcon fontSize="small" />}
                                        label="Distância"
                                        value={`${getSafeNumber(dados.distanciaKm)} km`}
                                        accent="#3498db"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<ScheduleIcon fontSize="small" />}
                                        label="Duração"
                                        value={formatDuration(dados.duracaoMin)}
                                        accent="#1f9d8b"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<SpeedIcon fontSize="small" />}
                                        label="Ritmo alvo"
                                        value={getSafeValue(dados.ritmoAlvo) || 'N/A'}
                                        accent="#f39c12"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <MetricCard
                                        icon={<TrendingUpIcon fontSize="small" />}
                                        label="Intensidade"
                                        value={intensidadePercent}
                                        accent="#b3ff00"
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
                                                borderColor: '#d1d5db',
                                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fbf3 100%)',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            <CardContent sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <AiIcon sx={{ color: '#b3ff00' }} />
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            color: '#6b7a8d',
                                                        }}
                                                    >
                                                        Insight da IA
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
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
                                                borderColor: '#d1d5db',
                                                background: '#ffffff',
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
                                                            color: '#6b7a8d',
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
                                                            color: '#1a2535',
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
                                                                border: '1px solid #d1d5db',
                                                                bgcolor: '#fff',
                                                                p: 1.5,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    color: '#6b7a8d',
                                                                    mb: 0.75,
                                                                }}
                                                            >
                                                                Leitura rápida
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                                                                A composição destaca a progressão do treino e facilita comparar
                                                                duração entre aquecimento, bloco principal e encerramento.
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <Box
                                                            sx={{
                                                                borderRadius: 1,
                                                                border: '1px solid #d1d5db',
                                                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fbf3 100%)',
                                                                p: 1.5,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em',
                                                                    color: '#6b7a8d',
                                                                    mb: 0.75,
                                                                }}
                                                            >
                                                                Resumo estrutural
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                                                                {blocks.length} bloco(s) planejado(s) com duração total de{' '}
                                                                <Box component="span" sx={{ fontWeight: 800, color: '#1a2535' }}>
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
                                                borderColor: '#d1d5db',
                                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
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
                                                        color: '#6b7a8d',
                                                        mb: 1,
                                                    }}
                                                >
                                                    Observações
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.7 }}>
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
                                                borderColor: '#d1d5db',
                                                background: '#fff',
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
                                                        color: '#6b7a8d',
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
                                                    borderColor: '#d1d5db',
                                                    background: '#fff',
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
                                                                color: '#6b7a8d',
                                                            }}
                                                        >
                                                            Blocos
                                                        </Typography>
                                                        <Chip
                                                            label="Resumo"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha('#3498db', 0.1),
                                                                color: '#1a5f8a',
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </Box>

                                                    <Stack spacing={1}>
                                                        {etapasOrdenadas.map((etapa, index) => {
                                                            const block = blocks[index];
                                                            const metric = resolveStageMetric(etapa);
                                                            const stageColor = block ? zones[block.zoneKey].border : getSafeColor(etapa.tipoEtapa, '#1976d2');

                                                            return (
                                                                <Box
                                                                    key={etapa.id ?? `etapa-card-${index}`}
                                                                    sx={{
                                                                        border: '1px solid #d1d5db',
                                                                        borderLeft: `3px solid ${stageColor}`,
                                                                        borderRadius: 1,
                                                                        bgcolor: alpha(stageColor, 0.06),
                                                                        p: 1.5,
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                                                                        <Box sx={{ minWidth: 0 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2535' }}>
                                                                                {getSafeLabel(etapa.tipoEtapa)}
                                                                            </Typography>
                                                                            {etapa.descricaoEtapa && (
                                                                                <Typography variant="caption" sx={{ color: '#6b7a8d', display: 'block', mt: 0.25 }}>
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
                                                                            <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                                                                                {metric.label}
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="caption"
                                                                                sx={{
                                                                                    fontFamily: 'Space Mono, monospace',
                                                                                    fontWeight: 700,
                                                                                    color: '#1a2535',
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
                                                    borderColor: '#d1d5db',
                                                    background: '#fff',
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
                                                            color: '#6b7a8d',
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
                                                                        <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                                                                            {block.label}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontFamily: 'Space Mono, monospace',
                                                                                color: '#6b7a8d',
                                                                            }}
                                                                        >
                                                                            {pct}%
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ height: 6, borderRadius: 999, bgcolor: '#edf2f7' }}>
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
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {dados.tssPlanejado != null && (
                        <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                            TSS planejado: <Box component="span" sx={{ fontWeight: 700, color: '#1a2535' }}>{dados.tssPlanejado}</Box>
                        </Typography>
                    )}
                </Box>
                <Button onClick={onClose} color="primary" size="small" variant="contained">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetalheTreinoDialog;
