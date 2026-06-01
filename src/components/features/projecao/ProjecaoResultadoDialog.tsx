import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { RaceProjectionSnapshot } from '../../../types/RaceProjection';
import {
    CTL_TREND_LABELS,
    CONFIDENCE_LABELS,
    GAP_ASSESSMENT_LABELS,
    formatDistanceLabel,
    formatSeconds,
    formatPace,
} from '../../../types/RaceProjection';
import ConfidenceBadge from './ConfidenceBadge';
import MarcarOficialButton from './MarcarOficialButton';

interface ProjecaoResultadoDialogProps {
    open: boolean;
    onClose: () => void;
    snapshot: RaceProjectionSnapshot;
    atletaId: string;
    atletaNome: string;
}

const GAP_ASSESSMENT_COLORS: Record<string, { bg: string; color: string }> = {
    ON_TRACK:  { bg: 'rgba(39, 174, 96, 0.12)',  color: '#1e8449' },
    REACHABLE: { bg: 'rgba(52, 152, 219, 0.12)', color: '#1a5f8a' },
    STRETCH:   { bg: 'rgba(243, 156, 18, 0.12)', color: '#b7770d' },
    UNLIKELY:  { bg: 'rgba(231, 76, 60, 0.12)',  color: '#c0392b' },
};

const CTL_TREND_COLORS: Record<string, string> = {
    BUILDING:  '#27ae60',
    STABLE:    '#2980b9',
    DECLINING: '#e74c3c',
};

const ProjecaoResultadoDialog: React.FC<ProjecaoResultadoDialogProps> = ({
    open,
    onClose,
    snapshot,
    atletaId,
    atletaNome,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);

    const projectionEntries = Object.entries(currentSnapshot.projections).sort(
        ([a], [b]) => parseInt(a, 10) - parseInt(b, 10)
    );

    const overallConfidence = projectionEntries.reduce<string | null>((worst, [, p]) => {
        const order = ['HIGH', 'MEDIUM', 'LOW'];
        if (!worst) return p.confidence;
        return order.indexOf(p.confidence) > order.indexOf(worst) ? p.confidence : worst;
    }, null) ?? 'LOW';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="md"
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
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 2.25 },
                    pr: { xs: 7, md: 8 },
                    color: 'white',
                    background: 'linear-gradient(135deg, #082130 0%, #0e3147 55%, #133c56 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            icon={<TrendingUpIcon sx={{ fontSize: 14, color: '#b1e92d !important' }} />}
                            label="Resultado da Projeção"
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#e8eaed', fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                        {/* Overall confidence badge in header */}
                        <Chip
                            label={`Confiança ${CONFIDENCE_LABELS[overallConfidence as keyof typeof CONFIDENCE_LABELS]}`}
                            size="small"
                            sx={{
                                bgcolor: overallConfidence === 'HIGH'
                                    ? 'rgba(39,174,96,0.25)'
                                    : overallConfidence === 'MEDIUM'
                                        ? 'rgba(243,156,18,0.25)'
                                        : 'rgba(231,76,60,0.25)',
                                color: overallConfidence === 'HIGH' ? '#b1e92d' : overallConfidence === 'MEDIUM' ? '#f9c74f' : '#ff6b6b',
                                fontWeight: 700,
                                border: '1px solid rgba(255,255,255,0.15)',
                            }}
                        />
                        {currentSnapshot.isOfficial && (
                            <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 13, color: '#b1e92d !important' }} />}
                                label="Oficial"
                                size="small"
                                sx={{ bgcolor: 'rgba(177,233,45,0.18)', color: '#b1e92d', fontWeight: 700, border: '1px solid rgba(177,233,45,0.3)' }}
                            />
                        )}
                    </Box>
                    <Typography
                        variant="h6"
                        sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1.15, pr: 2, fontSize: { xs: '1.05rem', md: '1.25rem' } }}
                    >
                        Projeção — {atletaNome}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ mt: 0.75, color: 'rgba(232, 234, 237, 0.72)', fontSize: { xs: '0.78rem', md: '0.85rem' } }}
                    >
                        {new Date(currentSnapshot.generatedAt).toLocaleString('pt-BR')} · {currentSnapshot.weeksToRace} semanas até a prova
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
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    p: 0,
                    background: 'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
                }}
            >
                <Stack spacing={2} sx={{ p: { xs: 1.5, md: 3 } }}>

                    {/* ── Tabela de projeções ── */}
                    <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 1.5, md: 2.5 }, overflowX: 'auto' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Projeções por Distância
                        </Typography>
                        <Table size="small" sx={{ mt: 1 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Distância</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Tempo Proj.</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Pace Proj.</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Intervalo (±3%)</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Confiança</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>PR</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projectionEntries.map(([distKey, proj]) => (
                                    <TableRow key={distKey} hover>
                                        <TableCell sx={{ fontWeight: 700 }}>{formatDistanceLabel(parseInt(distKey, 10))}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#0e3147' }}>
                                            {formatSeconds(proj.projectedTimeSeconds)}
                                        </TableCell>
                                        <TableCell sx={{ color: '#4a5568' }}>
                                            {formatPace(proj.projectedPaceSecPerKm)}
                                        </TableCell>
                                        <TableCell sx={{ color: '#6b7a8d', fontSize: '0.75rem' }}>
                                            {formatSeconds(proj.timeRangeOptimisticSec)} – {formatSeconds(proj.timeRangeConservativeSec)}
                                        </TableCell>
                                        <TableCell>
                                            <ConfidenceBadge confidence={proj.confidence} />
                                        </TableCell>
                                        <TableCell>
                                            {proj.prPotential && (
                                                <TrophyIcon sx={{ fontSize: 18, color: '#f39c12' }} titleAccess="Potencial de PR" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* ── Narrativa e coach note ── */}
                    {currentSnapshot.progressionNarrative && (
                        <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Análise de Progressão
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#2d3748', lineHeight: 1.65 }}>
                                {currentSnapshot.progressionNarrative}
                            </Typography>
                            {currentSnapshot.coachNote && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Nota do Coach
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.75, color: '#2d3748', fontStyle: 'italic' }}>
                                        {currentSnapshot.coachNote}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}

                    {/* ── Premissas ── */}
                    {currentSnapshot.keyAssumptions.length > 0 && (
                        <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Premissas e Limitações
                            </Typography>
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                                {currentSnapshot.keyAssumptions.map((assumption, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <Typography variant="body2" sx={{ color: '#6b7a8d', flexShrink: 0 }}>•</Typography>
                                        <Typography variant="body2" sx={{ color: '#4a5568' }}>{assumption}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* ── CTL Forecast ── */}
                    {currentSnapshot.ctlForecast && (
                        <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Previsão de CTL
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">CTL atual</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0e3147' }}>
                                        {currentSnapshot.ctlForecast.currentCtl.toFixed(1)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">CTL no dia da prova</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0e3147' }}>
                                        {currentSnapshot.ctlForecast.projectedCtlRaceDay.toFixed(1)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Tendência</Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 800, color: CTL_TREND_COLORS[currentSnapshot.ctlForecast.ctlTrend] ?? '#0e3147' }}
                                    >
                                        {CTL_TREND_LABELS[currentSnapshot.ctlForecast.ctlTrend]}
                                    </Typography>
                                </Box>
                                {currentSnapshot.ctlForecast.weeksToPeak != null && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Semanas p/ pico</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0e3147' }}>
                                            {currentSnapshot.ctlForecast.weeksToPeak}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* ── Goal Gap Analysis (coach-only) ── */}
                    {currentSnapshot.goalGapAnalysis && (
                        <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Análise de Gap em Relação à Meta
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Meta</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0e3147' }}>
                                        {formatSeconds(currentSnapshot.goalGapAnalysis.goalTimeSeconds)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Projetado</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0e3147' }}>
                                        {formatSeconds(currentSnapshot.goalGapAnalysis.projectedTimeSeconds)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Gap</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: currentSnapshot.goalGapAnalysis.gapSeconds <= 0 ? '#27ae60' : '#e74c3c' }}>
                                        {currentSnapshot.goalGapAnalysis.gapSeconds > 0 ? '+' : ''}{formatSeconds(Math.abs(currentSnapshot.goalGapAnalysis.gapSeconds))}
                                        {' '}({currentSnapshot.goalGapAnalysis.gapPct > 0 ? '+' : ''}{currentSnapshot.goalGapAnalysis.gapPct.toFixed(1)}%)
                                    </Typography>
                                </Box>
                                <Chip
                                    label={GAP_ASSESSMENT_LABELS[currentSnapshot.goalGapAnalysis.gapAssessment]}
                                    size="small"
                                    sx={{
                                        ...GAP_ASSESSMENT_COLORS[currentSnapshot.goalGapAnalysis.gapAssessment],
                                        fontWeight: 700,
                                        border: '1px solid rgba(0,0,0,0.08)',
                                    }}
                                />
                            </Box>
                            {currentSnapshot.goalGapAnalysis.coachNoteGap && (
                                <Alert severity="info" sx={{ mt: 1.5 }}>
                                    {currentSnapshot.goalGapAnalysis.coachNoteGap}
                                </Alert>
                            )}
                        </Box>
                    )}

                    {/* ── Metadados técnicos ── */}
                    {(currentSnapshot.regressionRSquared != null || currentSnapshot.riegelExponentUsed != null) && (
                        <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(248,250,252,0.9)', p: { xs: 1.5, md: 2 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Metadados Técnicos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mt: 0.75, flexWrap: 'wrap' }}>
                                {currentSnapshot.regressionRSquared != null && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">R² (regressão)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {currentSnapshot.regressionRSquared.toFixed(3)}
                                        </Typography>
                                    </Box>
                                )}
                                {currentSnapshot.riegelExponentUsed != null && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Exp. Riegel</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {currentSnapshot.riegelExponentUsed.toFixed(4)}
                                            {currentSnapshot.riegelCalibrated === false && (
                                                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#b7770d' }}>
                                                    (padrão)
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                )}
                                {currentSnapshot.weeksOfTrainingData != null && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Semanas de dados</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {currentSnapshot.weeksOfTrainingData}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: { xs: 2, md: 3 },
                    py: 2,
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1,
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    {currentSnapshot.isOfficial ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#27ae60' }} />
                            <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 600 }}>
                                Projeção oficial
                                {currentSnapshot.coachReviewedAt
                                    ? ` — revisada em ${new Date(currentSnapshot.coachReviewedAt).toLocaleDateString('pt-BR')}`
                                    : ''}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                            Marque como oficial para liberar ao atleta
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} size="small" fullWidth={isMobile}>
                        Fechar
                    </Button>
                    {!currentSnapshot.isOfficial && currentSnapshot.provaId && (
                        <MarcarOficialButton
                            atletaId={atletaId}
                            snapshotId={currentSnapshot.id}
                            provaId={currentSnapshot.provaId}
                            onSuccess={updated => setCurrentSnapshot(updated)}
                            fullWidth={isMobile}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ProjecaoResultadoDialog;
