import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { useProvas } from '../../../hooks/useProvas';
import { useRaceProjection } from '../../../hooks/useRaceProjection';
import type {
    GenerateRaceProjectionRequest,
    LoadProjectionData,
    PeriodizationPhase,
    RaceProjectionSnapshot,
} from '../../../types/RaceProjection';
import {
    PERIODIZATION_PHASE_LABELS,
    TARGET_DISTANCES,
} from '../../../types/RaceProjection';
import ProjecaoResultadoDialog from './ProjecaoResultadoDialog';
import { primary } from '../../../theme/tokens';

interface GerarProjecaoDialogProps {
    open: boolean;
    onClose: () => void;
    atletaId: string;
    atletaNome: string;
    preSelectedProvaId?: string;
}

const defaultLoad = (): LoadProjectionData => ({
    currentCtl: 50,
    currentAtl: 55,
    currentTsb: -5,
    targetRaceDate: '',
    weeksToRace: 4,
    plannedPeriodizationPhase: 'TAPER_OPTIMAL',
    projectedCtlOnRaceDay: 55,
    projectedTsbOnRaceDay: 5,
});

const GerarProjecaoDialog: React.FC<GerarProjecaoDialogProps> = ({
    open,
    onClose,
    atletaId,
    atletaNome,
    preSelectedProvaId,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { provas, loading: provasLoading, fetchProvas } = useProvas();
    const { generate, loading: generating, error: generateError, clearError } = useRaceProjection();

    const [selectedProvaId, setSelectedProvaId] = useState<string>(preSelectedProvaId ?? '');
    const [selectedDistances, setSelectedDistances] = useState<number[]>([10000, 21097]);
    const [load, setLoad] = useState<LoadProjectionData>(defaultLoad());
    const [goalTimeHours, setGoalTimeHours] = useState('');
    const [goalTimeMinutes, setGoalTimeMinutes] = useState('');
    const [goalTimeSeconds, setGoalTimeSeconds] = useState('');
    const [goalDistanceM, setGoalDistanceM] = useState<number>(10000);
    const [hasGoalOverride, setHasGoalOverride] = useState(false);
    const [weeksOverride, setWeeksOverride] = useState('');

    const [resultSnapshot, setResultSnapshot] = useState<RaceProjectionSnapshot | null>(null);
    const [resultOpen, setResultOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchProvas(atletaId);
            setSelectedProvaId(preSelectedProvaId ?? '');
            setSelectedDistances([10000, 21097]);
            setLoad(defaultLoad());
            setHasGoalOverride(false);
            setGoalTimeHours('');
            setGoalTimeMinutes('');
            setGoalTimeSeconds('');
            setWeeksOverride('');
            setSubmitError(null);
            clearError();
        }
    }, [open, atletaId, preSelectedProvaId, fetchProvas, clearError]);

    // Auto-fill targetRaceDate from selected prova
    useEffect(() => {
        if (selectedProvaId) {
            const prova = provas.find(p => p.id === selectedProvaId);
            if (prova?.dataProva) {
                const weeks = prova.diasFaltando ? Math.ceil(prova.diasFaltando / 7) : 4;
                setLoad(prev => ({
                    ...prev,
                    targetRaceDate: prova.dataProva,
                    weeksToRace: Math.max(1, weeks),
                }));
            }
        }
    }, [selectedProvaId, provas]);

    const toggleDistance = (dist: number) => {
        setSelectedDistances(prev =>
            prev.includes(dist) ? prev.filter(d => d !== dist) : [...prev, dist]
        );
    };

    const handleLoadChange = useCallback((field: keyof LoadProjectionData, value: string | number) => {
        setLoad(prev => ({
            ...prev,
            [field]: value,
            tsb: field === 'currentCtl' || field === 'currentAtl'
                ? (field === 'currentCtl' ? (value as number) : prev.currentCtl) -
                  (field === 'currentAtl' ? (value as number) : prev.currentAtl)
                : prev.currentTsb,
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (selectedDistances.length === 0) {
            setSubmitError('Selecione ao menos uma distância-alvo');
            return;
        }
        if (!load.targetRaceDate) {
            setSubmitError('Data da prova é obrigatória');
            return;
        }

        let coachGoalOverride: GenerateRaceProjectionRequest['coachGoalOverride'] = undefined;
        if (hasGoalOverride) {
            const h = parseInt(goalTimeHours || '0', 10);
            const m = parseInt(goalTimeMinutes || '0', 10);
            const s = parseInt(goalTimeSeconds || '0', 10);
            const totalSec = h * 3600 + m * 60 + s;
            if (totalSec > 0) {
                coachGoalOverride = { goalTimeSeconds: totalSec, targetDistanceM: goalDistanceM };
            }
        }

        const request: GenerateRaceProjectionRequest = {
            provaId: selectedProvaId || undefined,
            targetDistances: selectedDistances,
            loadProjection: load,
            coachGoalOverride,
            weeksToRaceOverride: weeksOverride ? parseInt(weeksOverride, 10) : undefined,
        };

        const result = await generate(atletaId, request);
        if (result) {
            setResultSnapshot(result);
            setResultOpen(true);
        } else {
            setSubmitError(generateError ?? 'Erro ao gerar projeção');
        }
    };

    const handleClose = () => {
        if (!generating) onClose();
    };

    const futurProvas = provas.filter(p => {
        const status = typeof p.statusProva === 'string'
            ? p.statusProva
            : (p.statusProva as any)?.value;
        return status !== 'CONCLUIDA' && status !== 'CANCELADA';
    });

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
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
                                icon={<TrendingUpIcon sx={{ fontSize: 14, color: `${primary[500]} !important` }} />}
                                label="Projeção de Prova"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    color: '#e8eaed',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}
                            />
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: 'Syne, sans-serif',
                                fontWeight: 800,
                                lineHeight: 1.15,
                                pr: 2,
                                fontSize: { xs: '1.05rem', md: '1.25rem' },
                            }}
                        >
                            Gerar Projeção — {atletaNome}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ mt: 0.75, color: 'rgba(232, 234, 237, 0.72)', fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                        >
                            Pipeline de 3 camadas: regressão de pace + Riegel + ajuste por periodização e TSB
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        disabled={generating}
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

                <form onSubmit={handleSubmit} noValidate>
                    <DialogContent
                        dividers
                        sx={{
                            p: 0,
                            background:
                                'radial-gradient(circle at top right, rgba(179,233,45,0.08), transparent 24%), linear-gradient(180deg, #eef3f8 0%, #e8edf4 100%)',
                        }}
                    >
                        <Stack spacing={2} sx={{ p: { xs: 1.5, md: 3 } }}>
                            {(submitError || generateError) && (
                                <Alert severity="error">{submitError ?? generateError}</Alert>
                            )}

                            {/* ── Prova e distâncias ── */}
                            <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 2, md: 2.5 } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Prova e Distâncias-Alvo
                                </Typography>
                                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                    <Grid size={12}>
                                        {provasLoading ? (
                                            <CircularProgress size={20} />
                                        ) : (
                                            <TextField
                                                select
                                                label="Prova (opcional)"
                                                value={selectedProvaId}
                                                onChange={e => setSelectedProvaId(e.target.value)}
                                                fullWidth
                                                size="small"
                                                helperText="Selecionar preenche automaticamente a data"
                                            >
                                                <MenuItem value="">Sem prova selecionada</MenuItem>
                                                {futurProvas.map(p => (
                                                    <MenuItem key={p.id} value={p.id}>
                                                        {p.nomeProva} — {p.dataProva}
                                                        {p.diasFaltando != null ? ` (${p.diasFaltando} dias)` : ''}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Grid>
                                    <Grid size={12}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                            Distâncias para projetar *
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {TARGET_DISTANCES.map(({ label, value }) => (
                                                <FormControlLabel
                                                    key={value}
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={selectedDistances.includes(value)}
                                                            onChange={() => toggleDistance(value)}
                                                        />
                                                    }
                                                    label={<Typography variant="body2">{label}</Typography>}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* ── Carga de treinamento ── */}
                            <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 2, md: 2.5 } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Carga de Treinamento
                                </Typography>
                                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                    <Grid size={4}>
                                        <TextField
                                            label="CTL atual"
                                            type="number"
                                            value={load.currentCtl}
                                            onChange={e => handleLoadChange('currentCtl', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Carga crônica"
                                            slotProps={{ htmlInput: { step: '0.1', min: 0 } }}
                                        />
                                    </Grid>
                                    <Grid size={4}>
                                        <TextField
                                            label="ATL atual"
                                            type="number"
                                            value={load.currentAtl}
                                            onChange={e => handleLoadChange('currentAtl', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Carga aguda"
                                            slotProps={{ htmlInput: { step: '0.1', min: 0 } }}
                                        />
                                    </Grid>
                                    <Grid size={4}>
                                        <TextField
                                            label="TSB atual"
                                            type="number"
                                            value={load.currentTsb}
                                            onChange={e => handleLoadChange('currentTsb', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Forma atual"
                                            slotProps={{ htmlInput: { step: '0.1' } }}
                                        />
                                    </Grid>
                                    <Grid size={4}>
                                        <TextField
                                            label="Data da prova *"
                                            type="date"
                                            value={load.targetRaceDate}
                                            onChange={e => handleLoadChange('targetRaceDate', e.target.value)}
                                            fullWidth
                                            required
                                            size="small"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={4}>
                                        <TextField
                                            label="Semanas até a prova"
                                            type="number"
                                            value={load.weeksToRace}
                                            onChange={e => handleLoadChange('weeksToRace', parseInt(e.target.value, 10) || 1)}
                                            fullWidth
                                            required
                                            size="small"
                                            slotProps={{ htmlInput: { min: 1, max: 52 } }}
                                        />
                                    </Grid>
                                    <Grid size={4}>
                                        <TextField
                                            select
                                            label="Fase de periodização *"
                                            value={load.plannedPeriodizationPhase}
                                            onChange={e => handleLoadChange('plannedPeriodizationPhase', e.target.value as PeriodizationPhase)}
                                            fullWidth
                                            required
                                            size="small"
                                        >
                                            {(Object.keys(PERIODIZATION_PHASE_LABELS) as PeriodizationPhase[]).map(phase => (
                                                <MenuItem key={phase} value={phase}>
                                                    {PERIODIZATION_PHASE_LABELS[phase]}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid size={6}>
                                        <TextField
                                            label="CTL projetado no dia da prova"
                                            type="number"
                                            value={load.projectedCtlOnRaceDay}
                                            onChange={e => handleLoadChange('projectedCtlOnRaceDay', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            required
                                            size="small"
                                            slotProps={{ htmlInput: { step: '0.1', min: 0 } }}
                                        />
                                    </Grid>
                                    <Grid size={6}>
                                        <TextField
                                            label="TSB projetado no dia da prova"
                                            type="number"
                                            value={load.projectedTsbOnRaceDay}
                                            onChange={e => handleLoadChange('projectedTsbOnRaceDay', parseFloat(e.target.value) || 0)}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Ideal: entre -5 e +10 (taper)"
                                            slotProps={{ htmlInput: { step: '0.1' } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* ── Overrides opcionais ── */}
                            <Box sx={{ borderRadius: 1, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)', p: { xs: 2, md: 2.5 } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Opcionais
                                </Typography>
                                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                    <Grid size={12}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={hasGoalOverride}
                                                    onChange={e => setHasGoalOverride(e.target.checked)}
                                                />
                                            }
                                            label={<Typography variant="body2">Informar meta do atleta (para análise de gap)</Typography>}
                                        />
                                    </Grid>
                                    {hasGoalOverride && (
                                        <>
                                            <Grid size={3}>
                                                <TextField label="Horas" type="number" value={goalTimeHours} onChange={e => setGoalTimeHours(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 9 } }} />
                                            </Grid>
                                            <Grid size={3}>
                                                <TextField label="Minutos" type="number" value={goalTimeMinutes} onChange={e => setGoalTimeMinutes(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 59 } }} />
                                            </Grid>
                                            <Grid size={3}>
                                                <TextField label="Segundos" type="number" value={goalTimeSeconds} onChange={e => setGoalTimeSeconds(e.target.value)} fullWidth size="small" slotProps={{ htmlInput: { min: 0, max: 59 } }} />
                                            </Grid>
                                            <Grid size={3}>
                                                <TextField
                                                    select
                                                    label="Distância da meta"
                                                    value={goalDistanceM}
                                                    onChange={e => setGoalDistanceM(parseInt(e.target.value, 10))}
                                                    fullWidth
                                                    size="small"
                                                >
                                                    {TARGET_DISTANCES.map(({ label, value }) => (
                                                        <MenuItem key={value} value={value}>{label}</MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                        </>
                                    )}

                                    <Divider sx={{ width: '100%', my: 0.5 }} />

                                    <Grid size={4}>
                                        <TextField
                                            label="Override de semanas"
                                            type="number"
                                            value={weeksOverride}
                                            onChange={e => setWeeksOverride(e.target.value)}
                                            fullWidth
                                            size="small"
                                            helperText="Sobrescreve o valor calculado"
                                            slotProps={{ htmlInput: { min: 1, max: 52 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
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
                            <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
                                A geração leva ~2–5 segundos (inclui análise por LLM)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button onClick={handleClose} disabled={generating} size="small" fullWidth={isMobile}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={generating || selectedDistances.length === 0}
                                size="small"
                                fullWidth={isMobile}
                                startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <TrendingUpIcon />}
                                sx={{ bgcolor: '#0e3147', '&:hover': { bgcolor: '#082130' } }}
                            >
                                {generating ? 'Gerando...' : 'Gerar Projeção'}
                            </Button>
                        </Box>
                    </DialogActions>
                </form>
            </Dialog>

            {resultSnapshot && (
                <ProjecaoResultadoDialog
                    open={resultOpen}
                    onClose={() => {
                        setResultOpen(false);
                        onClose();
                    }}
                    snapshot={resultSnapshot}
                    atletaId={atletaId}
                    atletaNome={atletaNome}
                />
            )}
        </>
    );
};

export default GerarProjecaoDialog;
