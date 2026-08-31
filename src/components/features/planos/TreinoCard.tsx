import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    Box,
    Chip,
    Stack,
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
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import { PRIMARY_CAUSE_LABEL } from '../../../types/AnaliseWorkout';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { glassSx, glass, semantic, surface } from '../../../theme/tokens';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';
import { effortColor } from '../../../shared/theme/workoutColors';

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

const TreinoCard: React.FC<TreinoCardProps> = ({ treino, onDetalhes, onMarcarRealizado, onMarcarPerdido }) => {
    const [expandedInsight, setExpandedInsight] = useState(false);
    const [rpeDialogOpen, setRpeDialogOpen] = useState(false);
    const [rpeValue, setRpeValue] = useState<number>(treino.percepcaoEsforcoRealizado ?? 5);
    const [currentRpe, setCurrentRpe] = useState<number | undefined>(treino.percepcaoEsforcoRealizado);
    const [savingRpe, setSavingRpe] = useState(false);
    const [analise, setAnalise] = useState<AnaliseWorkout | null>(null);
    const [analiseStatus, setAnaliseStatus] = useState<'idle' | 'loading' | 'pending' | 'done' | 'error'>('idle');

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

    // Busca análise AI quando treino realizado tem RPE definido
    useEffect(() => {
        if (!isRealizado || !treino.treinoRealizadoId || currentRpe == null) return;
        setAnaliseStatus('loading');
        AnaliseService.getAnaliseTreino(treino.treinoRealizadoId)
            .then((data) => {
                if (!data) {
                    setAnaliseStatus('pending');
                    return;
                }
                if (data.status === 'COMPLETED') {
                    setAnalise(data);
                    setAnaliseStatus('done');
                } else if (data.status === 'PENDING') {
                    setAnaliseStatus('pending');
                } else {
                    setAnaliseStatus('error');
                }
            })
            .catch(() => setAnaliseStatus('idle'));
    }, [isRealizado, treino.treinoRealizadoId, currentRpe]);

    const mostrarInsight = isRealizado && (analiseStatus === 'done' || analiseStatus === 'pending' || analiseStatus === 'loading');

    return (
        <Card
            elevation={1}
            sx={{
                ...glassSx,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isRealizado || isPerdido ? '2px solid' : `1px solid ${glass.border}`,
                borderColor: isRealizado ? semantic.success[500] : isPerdido ? semantic.danger[500] : undefined,
                bgcolor: isRealizado
                    ? `${semantic.success[500]}40`
                    : isPerdido
                    ? `${semantic.danger[500]}14`
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
                                            sx={{ fontWeight: 700, color: effortColor(currentRpe) }}
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

            {mostrarInsight && (
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        mx: 2,
                        mb: 2,
                        background: `linear-gradient(135deg, ${semantic.warning[500]}1F 0%, ${semantic.warning[500]}0F 100%)`,
                        border: `1px solid ${semantic.warning[500]}40`,
                        borderRadius: 1.5,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <InsightIcon
                            fontSize="small"
                            sx={{ color: semantic.warning[400], flexShrink: 0 }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: surface[200],
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontSize: '0.7rem',
                                flexGrow: 1,
                            }}
                        >
                            Coach Insight
                        </Typography>
                        {analise?.executionScore != null && (
                            <Chip
                                label={`${analise.executionScore}/10`}
                                size="small"
                                sx={{
                                    bgcolor: effortColor(analise.executionScore),
                                    color: surface[900],
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 20,
                                }}
                            />
                        )}
                    </Box>

                    {(analiseStatus === 'loading' || analiseStatus === 'pending') && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            {analiseStatus === 'loading' ? 'Carregando análise…' : 'Análise AI em andamento…'}
                        </Typography>
                    )}

                    {analiseStatus === 'done' && analise && (
                        <>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: surface[200],
                                    lineHeight: 1.5,
                                    display: expandedInsight ? 'block' : '-webkit-box',
                                    WebkitLineClamp: expandedInsight ? 'unset' : 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {analise.summary}
                            </Typography>

                            {expandedInsight && analise.recommendation && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${semantic.warning[500]}33` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400] }}>
                                        Recomendação
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: surface[200], lineHeight: 1.5 }}>
                                        {analise.recommendation}
                                    </Typography>
                                    {analise.primaryCause && (
                                        <Chip
                                            label={PRIMARY_CAUSE_LABEL[analise.primaryCause]}
                                            size="small"
                                            sx={{ mt: 0.75, bgcolor: `${semantic.warning[500]}26`, fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            )}

                            {expandedInsight && analise.atletaComoFoi && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${semantic.warning[500]}33` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: surface[400] }}>
                                        O que o atleta leu
                                    </Typography>
                                    {[analise.atletaReconhecimento, analise.atletaComoFoi, analise.atletaEsforco, analise.atletaProximoTreino]
                                        .filter(Boolean)
                                        .map((texto) => (
                                            <Typography key={texto} variant="body2" sx={{ color: surface[200], lineHeight: 1.5, mt: 0.5 }}>
                                                {texto}
                                            </Typography>
                                        ))}
                                </Box>
                            )}

                            <Button
                                size="small"
                                onClick={() => setExpandedInsight(!expandedInsight)}
                                sx={{
                                    mt: 0.5,
                                    textTransform: 'none',
                                    color: semantic.warning[400],
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
                        </>
                    )}
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
                                color: semantic.danger[500],
                                borderColor: semantic.danger[500],
                                '&:hover': {
                                    bgcolor: `${semantic.danger[500]}14`,
                                    borderColor: semantic.danger[700],
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
            <CoachDialog
                open={rpeDialogOpen}
                onClose={() => setRpeDialogOpen(false)}
                maxWidth="xs"
                disableClose={savingRpe}
                title="Percepção de Esforço (RPE)"
                subtitle="Como você avalia o esforço deste treino?"
                actions={
                    <>
                        <Button
                            onClick={() => setRpeDialogOpen(false)}
                            disabled={savingRpe}
                            sx={GHOST_BTN_SX}
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
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: effortColor(rpeValue), color: surface[50], '&:hover': { bgcolor: effortColor(rpeValue), filter: 'brightness(0.9)' } }}
                        >
                            {savingRpe ? 'Salvando…' : 'Salvar RPE'}
                        </Button>
                    </>
                }
            >
                <Box sx={{ px: 1, pt: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Typography
                            variant="h2"
                            sx={{ fontWeight: 800, color: effortColor(rpeValue), lineHeight: 1 }}
                        >
                            {rpeValue}
                        </Typography>
                        <Typography variant="h5" sx={{ alignSelf: 'flex-end', color: surface[400], ml: 0.5 }}>
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
                            color: effortColor(rpeValue),
                            '& .MuiSlider-markLabel': { fontSize: '0.7rem', color: surface[400] },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: surface[400] }}>Muito leve</Typography>
                        <Typography variant="caption" sx={{ color: surface[400] }}>Máximo</Typography>
                    </Box>
                </Box>
            </CoachDialog>
        </Card>
    );
};

export default TreinoCard;
