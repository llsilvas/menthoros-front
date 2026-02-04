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
    Divider,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
} from '@mui/material';
import {
    Close as CloseIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    Speed as SpeedIcon,
    AutoAwesome as AiIcon,
    FavoriteBorder as HeartIcon,
    Repeat as RepeatIcon,
    FitnessCenter as FitnessIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoPlanejado, EtapaTreino } from '../../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber, getSafeLabel, getSafeColor } from '../../../utils/safeValues';

interface DetalheTreinoDialogProps {
    open: boolean;
    onClose: () => void;
    treino: TreinoPlanejado | null;
}

const EtapaStepIcon: React.FC<{ color: string; ordem: number }> = ({ color, ordem }) => (
    <Box
        sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.85rem',
        }}
    >
        {ordem}
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
                        bgcolor: i < value ? getColor(value) : 'grey.300',
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

    const duracaoDisplay = dados.duracaoMin != null ? String(dados.duracaoMin) : 'N/A';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                    {getSafeValue(dados.tipoTreino)}
                </Typography>
                <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                        bgcolor: statusColor,
                        color: 'white',
                        fontWeight: 'bold',
                    }}
                />
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {loadingDetalhes ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
                        <CircularProgress size={48} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Carregando detalhes do treino...
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* Seção 1: Info do Treino */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={diaSemanaLabel}
                                color="primary"
                                variant="outlined"
                                size="small"
                            />
                            {dados.dataTreino && (
                                <Chip
                                    label={new Date(dados.dataTreino + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                            {fonteDadosLabel && (
                                <Chip
                                    label={fonteDadosLabel}
                                    size="small"
                                    sx={{
                                        bgcolor: getSafeColor(dados.fonteDados, '#9E9E9E'),
                                        color: 'white',
                                    }}
                                />
                            )}
                        </Box>

                        {/* Seção 2: Métricas Resumidas */}
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    Métricas do Treino
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RunIcon fontSize="small" color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Distância
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {getSafeNumber(dados.distanciaKm)} km
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ScheduleIcon fontSize="small" color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Duração
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {duracaoDisplay}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SpeedIcon fontSize="small" color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Ritmo Alvo
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {getSafeValue(dados.ritmoAlvo) || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FitnessIcon fontSize="small" color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    TSS Planejado
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {dados.tssPlanejado ?? 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingUpIcon fontSize="small" color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Intensidade
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {intensidadePercent}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {dados.percepcaoEsforcoEsperada != null && (
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                                    Percepção de Esforço (PSE)
                                                </Typography>
                                                <RpeScale value={dados.percepcaoEsforcoEsperada} />
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Seção 3: Justificativa da IA */}
                        {dados.justificativaIa && (
                            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AiIcon color="secondary" />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Justificativa da IA
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {dados.justificativaIa}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {/* Seção 4: Etapas do Treino */}
                        {etapasOrdenadas.length > 0 && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        Etapas do Treino ({etapasOrdenadas.length})
                                    </Typography>
                                    <Stepper orientation="vertical" nonLinear activeStep={-1}>
                                        {etapasOrdenadas.map((etapa: EtapaTreino, index: number) => {
                                            const etapaColor = getSafeColor(etapa.tipoEtapa, '#1976d2');
                                            const etapaLabel = getSafeLabel(etapa.tipoEtapa);
                                            const ordem = etapa.ordem ?? (index + 1);

                                            return (
                                                <Step key={index} completed expanded>
                                                    <StepLabel
                                                        StepIconComponent={() => (
                                                            <EtapaStepIcon color={etapaColor} ordem={ordem} />
                                                        )}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                label={etapaLabel}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: etapaColor,
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.75rem',
                                                                }}
                                                            />
                                                            {etapa.descricaoEtapa && (
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {etapa.descricaoEtapa}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </StepLabel>
                                                    <StepContent>
                                                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                                            {etapa.duracaoMin != null && (
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <ScheduleIcon fontSize="small" color="action" />
                                                                        <Typography variant="body2">
                                                                            {etapa.duracaoMin} min
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {etapa.distanciaKm != null && (
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <RunIcon fontSize="small" color="action" />
                                                                        <Typography variant="body2">
                                                                            {etapa.distanciaKm} km
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {etapa.fcAlvoEtapa && (
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <HeartIcon fontSize="small" color="action" />
                                                                        <Typography variant="body2">
                                                                            {etapa.fcAlvoEtapa}
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                            )}

                                                            {etapa.repeticoes != null && etapa.repeticoes > 1 && (
                                                                <Grid size={{ xs: 6, sm: 3 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <RepeatIcon fontSize="small" color="action" />
                                                                        <Typography variant="body2">
                                                                            {etapa.repeticoes}x
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </StepContent>
                                                </Step>
                                            );
                                        })}
                                    </Stepper>
                                </Box>
                            </>
                        )}

                        {/* Seção 5: Observações */}
                        {(dados.observacao || dados.descricao) && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Observações
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {dados.observacao || dados.descricao}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetalheTreinoDialog;
