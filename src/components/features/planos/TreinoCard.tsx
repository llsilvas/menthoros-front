import React from 'react';
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

            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={onDetalhes}
                        sx={{ flexShrink: 0 }}
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
                            fullWidth
                            onClick={onMarcarRealizado}
                            sx={{
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
