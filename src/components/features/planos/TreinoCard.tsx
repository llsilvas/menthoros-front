import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    Box,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
} from '@mui/material';
import {
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as PendingIcon,
    Cancel as CancelIcon,
    Speed as SpeedIcon,
    InfoOutlined as InfoIcon,
    EmojiEvents as TrophyIcon,
    LightbulbOutlined as InsightIcon,
    ExpandMore as ExpandMoreIcon,
    FitnessCenter as RpeIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { glassSx, glass } from '../../../theme/tokens';

interface TreinoCardProps {
    treino: TreinoPlanejado;
    onDetalhes: () => void;
    onMarcarRealizado: () => void;
    onMarcarPerdido?: () => void;
}

const MetricItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
    icon,
    label,
    value,
}) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {icon}
        <Box>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

const RPE_MARKS = [1,2,3,4,5,6,7,8,9,10].map(v => ({ value: v, label: String(v) }));

function getRpeColor(rpe: number): string {
    if (rpe <= 3) return '#4caf50';
    if (rpe <= 5) return '#8bc34a';
    if (rpe <= 7) return '#ffc107';
    if (rpe <= 8) return '#ff9800';
    if (rpe <= 9) return '#ff5722';
    return '#f44336';
}

const TreinoCard: React.FC<TreinoCardProps> = ({ treino, onDetalhes, onMarcarRealizado, onMarcarPerdido }) => {
    const [expandedInsight, setExpandedInsight] = useState(false);
    const [rpeDialogOpen, setRpeDialogOpen] = useState(false);
    const [rpeValue, setRpeValue] = useState<number>(treino.percepcaoEsforcoRealizado ?? 5);
    const [currentRpe, setCurrentRpe] = useState<number | undefined>(treino.percepcaoEsforcoRealizado);
    const [savingRpe, setSavingRpe] = useState(false);

    const statusValue = typeof treino.statusTreino === 'object'
        ? treino.statusTreino?.value
        : treino.statusTreino;
    const isRealizado = statusValue === 'REALIZADO' || treino.realizado === true;
    const isPerdido = statusValue === 'PERDIDO';
    const hoje = new Date().toISOString().split('T')[0];
    const treinoPassado = treino.dataTreino ? treino.dataTreino <= hoje : false;
    const podeMarcardPerdido = !isRealizado && !isPerdido && treinoPassado && !!onMarcarPerdido;
    const duracaoDisplay = treino.duracaoMin != null ? String(treino.duracaoMin) : null;
    const ritmoAlvo = getSafeValue(treino.ritmoAlvo);
    const rpeEsperado = treino.percepcaoEsforcoEsperada;

    // Mock feedback da LLM - será substituído pelo backend
    const feedbackComTreino = 'Excelente ritmo mantido! Sua consistência melhorou 12% em relação à semana passada. Continue focando na progressão gradual.';
    const mostrarFeedback = isRealizado && feedbackComTreino;

    return (
        <Card
            elevation={1}
            sx={{
                ...glassSx,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isRealizado || isPerdido ? '2px solid' : `1px solid ${glass.border}`,
                borderColor: isRealizado ? 'success.main' : isPerdido ? 'error.main' : undefined,
                bgcolor: isRealizado
                    ? 'rgba(76, 175, 80, 0.25)'
                    : isPerdido
                    ? 'rgba(244, 67, 54, 0.08)'
                    : glass.background,
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                {/* Header: dia da semana + icone de status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip
                        label={getSafeValue(treino.diaSemana)}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                    {isRealizado ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                    ) : isPerdido ? (
                        <CancelIcon sx={{ color: 'error.main' }} fontSize="small" />
                    ) : (
                        <PendingIcon color="action" fontSize="small" />
                    )}
                </Box>

                {/* Tipo de treino */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {getSafeValue(treino.tipoTreino)}
                </Typography>

                {/* Métricas */}
                <Stack spacing={1}>
                    <MetricItem
                        icon={<RunIcon fontSize="small" color="action" />}
                        label="Distância"
                        value={`${getSafeNumber(treino.distanciaKm)} km`}
                    />
                    {duracaoDisplay && (
                        <MetricItem
                            icon={<ScheduleIcon fontSize="small" color="action" />}
                            label="Duração"
                            value={duracaoDisplay}
                        />
                    )}
                    {ritmoAlvo && (
                        <MetricItem
                            icon={<SpeedIcon fontSize="small" color="action" />}
                            label="Ritmo alvo"
                            value={String(ritmoAlvo)}
                        />
                    )}
                    {typeof rpeEsperado === 'number' && (
                        <MetricItem
                            icon={<SpeedIcon fontSize="small" color="action" />}
                            label="Esforço esperado"
                            value={`${rpeEsperado}/10`}
                        />
                    )}
                    {isRealizado && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <RpeIcon fontSize="small" color="action" />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Esforço realizado (RPE)
                                </Typography>
                                {currentRpe != null ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 700, color: getRpeColor(currentRpe) }}
                                        >
                                            {currentRpe}/10
                                        </Typography>
                                        {treino.treinoRealizadoId && (
                                            <EditIcon
                                                fontSize="inherit"
                                                sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: '0.85rem' }}
                                                onClick={() => {
                                                    setRpeValue(currentRpe);
                                                    setRpeDialogOpen(true);
                                                }}
                                            />
                                        )}
                                    </Box>
                                ) : treino.treinoRealizadoId ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'warning.main', cursor: 'pointer', fontWeight: 600 }}
                                        onClick={() => {
                                            setRpeValue(5);
                                            setRpeDialogOpen(true);
                                        }}
                                    >
                                        + Adicionar RPE
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="text.disabled">
                                        —
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </CardContent>

            {mostrarFeedback && (
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        mx: 2,
                        mb: 2,
                        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.08) 100%)',
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        borderRadius: 1.5,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <InsightIcon
                            fontSize="small"
                            sx={{
                                color: 'rgba(255, 152, 0, 0.8)',
                                mt: 0.5,
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(0, 0, 0, 0.7)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: '0.7rem',
                            }}
                        >
                            Coach Insight
                        </Typography>
                    </Box>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(0, 0, 0, 0.75)',
                            lineHeight: 1.5,
                            display: expandedInsight ? 'block' : '-webkit-box',
                            WebkitLineClamp: expandedInsight ? 'unset' : 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                        }}
                    >
                        {feedbackComTreino}
                    </Typography>

                    <Button
                        size="small"
                        onClick={() => setExpandedInsight(!expandedInsight)}
                        sx={{
                            mt: 0.5,
                            textTransform: 'none',
                            color: 'rgba(255, 152, 0, 0.9)',
                            fontSize: '0.75rem',
                            p: 0,
                            '&:hover': { bgcolor: 'transparent' },
                        }}
                        endIcon={
                            <ExpandMoreIcon
                                fontSize="small"
                                sx={{
                                    transition: 'transform 0.3s ease',
                                    transform: expandedInsight ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            />
                        }
                    >
                        {expandedInsight ? 'Ver menos' : 'Ver mais'}
                    </Button>
                </Box>
            )}

            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={onDetalhes}
                        sx={{ flex: 1, minWidth: 0 }}
                    >
                        Detalhes
                    </Button>
                    {isRealizado && treino.treinoRealizadoId && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={currentRpe != null ? <EditIcon /> : <AddIcon />}
                            onClick={() => {
                                setRpeValue(currentRpe ?? 5);
                                setRpeDialogOpen(true);
                            }}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                color: currentRpe != null ? 'text.secondary' : 'warning.main',
                                borderColor: currentRpe != null ? 'divider' : 'warning.main',
                            }}
                        >
                            RPE
                        </Button>
                    )}
                    {podeMarcardPerdido && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={onMarcarPerdido}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                color: 'error.main',
                                borderColor: 'error.main',
                                '&:hover': {
                                    bgcolor: 'rgba(244, 67, 54, 0.08)',
                                    borderColor: 'error.dark',
                                },
                            }}
                        >
                            Perdido
                        </Button>
                    )}
                    {!isRealizado && !isPerdido && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<TrophyIcon />}
                            onClick={onMarcarRealizado}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                bgcolor: 'success.main',
                                '&:hover': { bgcolor: 'success.dark' },
                            }}
                        >
                            Realizado
                        </Button>
                    )}
                </Stack>
            </CardActions>

            {/* Dialog de RPE */}
            <Dialog
                open={rpeDialogOpen}
                onClose={() => setRpeDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RpeIcon color="action" />
                        <Typography variant="h6">Percepção de Esforço (RPE)</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Como você avalia o esforço deste treino?
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ px: 1, pt: 2, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Typography
                                variant="h2"
                                sx={{ fontWeight: 800, color: getRpeColor(rpeValue), lineHeight: 1 }}
                            >
                                {rpeValue}
                            </Typography>
                            <Typography variant="h5" sx={{ alignSelf: 'flex-end', color: 'text.secondary', ml: 0.5 }}>
                                /10
                            </Typography>
                        </Box>
                        <Slider
                            value={rpeValue}
                            onChange={(_, v) => setRpeValue(v as number)}
                            min={1}
                            max={10}
                            step={1}
                            marks={RPE_MARKS}
                            sx={{
                                color: getRpeColor(rpeValue),
                                '& .MuiSlider-markLabel': { fontSize: '0.7rem' },
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Muito leve</Typography>
                            <Typography variant="caption" color="text.secondary">Máximo</Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setRpeDialogOpen(false)}
                        disabled={savingRpe}
                        color="inherit"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        disabled={savingRpe}
                        onClick={async () => {
                            if (!treino.treinoRealizadoId) return;
                            setSavingRpe(true);
                            try {
                                await TreinoService.atualizarTreino(treino.treinoRealizadoId, {
                                    percepcaoEsforco: rpeValue,
                                });
                                setCurrentRpe(rpeValue);
                                setRpeDialogOpen(false);
                            } finally {
                                setSavingRpe(false);
                            }
                        }}
                        sx={{ bgcolor: getRpeColor(rpeValue), '&:hover': { bgcolor: getRpeColor(rpeValue), filter: 'brightness(0.9)' } }}
                    >
                        {savingRpe ? 'Salvando…' : 'Salvar RPE'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default TreinoCard;
