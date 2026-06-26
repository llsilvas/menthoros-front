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
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

interface ProjecaoResultadoDialogProps {
    open: boolean;
    onClose: () => void;
    snapshot: RaceProjectionSnapshot;
    atletaId: string;
    atletaNome: string;
}

// Avaliação do gap mapeada às zonas semânticas: no alvo→success, alcançável→info, esforço→warning, improvável→danger.
const GAP_ASSESSMENT_COLORS: Record<string, { bg: string; color: string }> = {
    ON_TRACK:  { bg: `${semantic.success[500]}1F`, color: semantic.success[500] },
    REACHABLE: { bg: `${semantic.info[500]}1F`,    color: semantic.info[500] },
    STRETCH:   { bg: `${semantic.warning[500]}1F`, color: semantic.warning[400] },
    UNLIKELY:  { bg: `${semantic.danger[500]}1F`,  color: semantic.danger[300] },
};

const CTL_TREND_COLORS: Record<string, string> = {
    BUILDING:  semantic.success[500],
    STABLE:    semantic.info[500],
    DECLINING: semantic.danger[500],
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
                        backgroundColor: elevation.base,
                        border: `1px solid ${content.cardBorder}`,
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
                    color: surface[50],
                    background: `linear-gradient(135deg, ${elevation.base} 0%, ${elevation.panel} 55%, ${elevation.card} 100%)`,
                    borderBottom: `1px solid ${content.divider}`,
                }}
            >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            icon={<TrendingUpIcon sx={{ fontSize: 14, color: `${primary[500]} !important` }} />}
                            label="Resultado da Projeção"
                            size="small"
                            sx={{ bgcolor: `${surface[0]}1F`, color: surface[200], fontWeight: 700, border: `1px solid ${surface[0]}1F` }}
                        />
                        {/* Overall confidence badge in header */}
                        <Chip
                            label={`Confiança ${CONFIDENCE_LABELS[overallConfidence as keyof typeof CONFIDENCE_LABELS]}`}
                            size="small"
                            sx={{
                                bgcolor: overallConfidence === 'HIGH'
                                    ? `${semantic.success[500]}3D`
                                    : overallConfidence === 'MEDIUM'
                                        ? `${semantic.warning[500]}3D`
                                        : `${semantic.danger[500]}3D`,
                                color: overallConfidence === 'HIGH' ? semantic.success[500] : overallConfidence === 'MEDIUM' ? semantic.warning[400] : semantic.danger[300],
                                fontWeight: 700,
                                border: `1px solid ${surface[0]}26`,
                            }}
                        />
                        {currentSnapshot.isOfficial && (
                            <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 13, color: `${primary[500]} !important` }} />}
                                label="Oficial"
                                size="small"
                                sx={{ bgcolor: `${primary[500]}2E`, color: primary[500], fontWeight: 700, border: `1px solid ${primary[500]}4D` }}
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
                        sx={{ mt: 0.75, color: surface[400], fontSize: { xs: '0.78rem', md: '0.85rem' } }}
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
                        color: surface[50],
                        bgcolor: `${surface[0]}0F`,
                        border: `1px solid ${surface[0]}14`,
                        '&:hover': { bgcolor: `${surface[0]}1F` },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    p: 0,
                    background: `radial-gradient(circle at top right, ${primary[500]}14, transparent 24%), linear-gradient(180deg, ${elevation.base} 0%, ${elevation.panel} 100%)`,
                }}
            >
                <Stack spacing={2} sx={{ p: { xs: 1.5, md: 3 } }}>

                    {/* ── Tabela de projeções ── */}
                    <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2.5 }, overflowX: 'auto' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                                        <TableCell sx={{ fontWeight: 700, color: surface[50] }}>
                                            {formatSeconds(proj.projectedTimeSeconds)}
                                        </TableCell>
                                        <TableCell sx={{ color: surface[200] }}>
                                            {formatPace(proj.projectedPaceSecPerKm)}
                                        </TableCell>
                                        <TableCell sx={{ color: surface[500], fontSize: '0.75rem' }}>
                                            {formatSeconds(proj.timeRangeOptimisticSec)} – {formatSeconds(proj.timeRangeConservativeSec)}
                                        </TableCell>
                                        <TableCell>
                                            <ConfidenceBadge confidence={proj.confidence} />
                                        </TableCell>
                                        <TableCell>
                                            {proj.prPotential && (
                                                <TrophyIcon sx={{ fontSize: 18, color: semantic.warning[500] }} titleAccess="Potencial de PR" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* ── Narrativa e coach note ── */}
                    {currentSnapshot.progressionNarrative && (
                        <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Análise de Progressão
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: surface[200], lineHeight: 1.65 }}>
                                {currentSnapshot.progressionNarrative}
                            </Typography>
                            {currentSnapshot.coachNote && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Nota do Coach
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.75, color: surface[200], fontStyle: 'italic' }}>
                                        {currentSnapshot.coachNote}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}

                    {/* ── Premissas ── */}
                    {currentSnapshot.keyAssumptions.length > 0 && (
                        <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Premissas e Limitações
                            </Typography>
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                                {currentSnapshot.keyAssumptions.map((assumption, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <Typography variant="body2" sx={{ color: surface[500], flexShrink: 0 }}>•</Typography>
                                        <Typography variant="body2" sx={{ color: surface[200] }}>{assumption}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* ── CTL Forecast ── */}
                    {currentSnapshot.ctlForecast && (
                        <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Previsão de CTL
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>CTL atual</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: surface[50] }}>
                                        {currentSnapshot.ctlForecast.currentCtl.toFixed(1)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>CTL no dia da prova</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: surface[50] }}>
                                        {currentSnapshot.ctlForecast.projectedCtlRaceDay.toFixed(1)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>Tendência</Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 800, color: CTL_TREND_COLORS[currentSnapshot.ctlForecast.ctlTrend] ?? surface[50] }}
                                    >
                                        {CTL_TREND_LABELS[currentSnapshot.ctlForecast.ctlTrend]}
                                    </Typography>
                                </Box>
                                {currentSnapshot.ctlForecast.weeksToPeak != null && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: surface[400] }}>Semanas p/ pico</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: surface[50] }}>
                                            {currentSnapshot.ctlForecast.weeksToPeak}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* ── Goal Gap Analysis (coach-only) ── */}
                    {currentSnapshot.goalGapAnalysis && (
                        <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2.5 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Análise de Gap em Relação à Meta
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>Meta</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: surface[50] }}>
                                        {formatSeconds(currentSnapshot.goalGapAnalysis.goalTimeSeconds)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>Projetado</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: surface[50] }}>
                                        {formatSeconds(currentSnapshot.goalGapAnalysis.projectedTimeSeconds)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: surface[400] }}>Gap</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: currentSnapshot.goalGapAnalysis.gapSeconds <= 0 ? semantic.success[500] : semantic.danger[500] }}>
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
                                        border: `1px solid ${content.cardBorder}`,
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
                        <Box sx={{ borderRadius: 1, border: `1px solid ${content.cardBorder}`, background: elevation.card, p: { xs: 1.5, md: 2 } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Metadados Técnicos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mt: 0.75, flexWrap: 'wrap' }}>
                                {currentSnapshot.regressionRSquared != null && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: surface[400] }}>R² (regressão)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {currentSnapshot.regressionRSquared.toFixed(3)}
                                        </Typography>
                                    </Box>
                                )}
                                {currentSnapshot.riegelExponentUsed != null && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: surface[400] }}>Exp. Riegel</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {currentSnapshot.riegelExponentUsed.toFixed(4)}
                                            {currentSnapshot.riegelCalibrated === false && (
                                                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: semantic.warning[700] }}>
                                                    (padrão)
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                )}
                                {currentSnapshot.weeksOfTrainingData != null && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: surface[400] }}>Semanas de dados</Typography>
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
                    background: elevation.panel,
                    borderTop: `1px solid ${content.divider}`,
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1,
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    {currentSnapshot.isOfficial ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
                            <Typography variant="caption" sx={{ color: semantic.success[500], fontWeight: 600 }}>
                                Projeção oficial
                                {currentSnapshot.coachReviewedAt
                                    ? ` — revisada em ${new Date(currentSnapshot.coachReviewedAt).toLocaleDateString('pt-BR')}`
                                    : ''}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="caption" sx={{ color: surface[500] }}>
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
