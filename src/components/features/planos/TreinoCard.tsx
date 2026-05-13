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
} from '@mui/icons-material';
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

const TreinoCard: React.FC<TreinoCardProps> = ({ treino, onDetalhes, onMarcarRealizado, onMarcarPerdido }) => {
    const [expandedInsight, setExpandedInsight] = useState(false);
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
        </Card>
    );
};

export default TreinoCard;
