import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Card,
    Chip,
    Grid,
    Stack,
    TextField,
    IconButton,
    Slider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { TreinoService } from '../../api/services/TreinoService';
import type { TreinoRealizado } from '../../types/TreinoRealizado';
import type { TreinoPlanejado } from '../../types/TreinoPlanejado';

interface TreinoRealizadoDialogProps {
    open: boolean;
    onClose: () => void;
    treino: TreinoPlanejado | null;
    atletaId: string;
    planoSemanalId: string;
    onSuccess?: () => void;
}

const TreinoRealizadoDialog: React.FC<TreinoRealizadoDialogProps> = ({
    open,
    onClose,
    treino,
    atletaId,
    planoSemanalId,
    onSuccess
}) => {
    const [loadingSave, setLoadingSave] = useState(false);

    // Dados editáveis do treino realizado
    const [dataTreino, setDataTreino] = useState(new Date().toISOString().split('T')[0]);
    const [distanciaKm, setDistanciaKm] = useState(0);
    const [duracaoMin, setDuracaoMin] = useState<number | ''>('');
    const [comentario, setComentario] = useState('');
    const [percepcaoEsforco, setPercepcaoEsforco] = useState<number | ''>(5);
    const [ritmoMedio, setRitmoMedio] = useState('');
    const [fcMedia, setFcMedia] = useState<number | ''>('');
    const [fcMax, setFcMax] = useState<number | ''>('');
    const [cadenciaMedia, setCadenciaMedia] = useState<number | ''>('');
    const [potenciaMedia, setPotenciaMedia] = useState<number | ''>('');
    const [elevacaoTotalMetros, setElevacaoTotalMetros] = useState<number | ''>('');

    // Atualiza os campos quando o treino muda
    React.useEffect(() => {
        if (treino && open) {
            setDataTreino(new Date().toISOString().split('T')[0]);
            setDistanciaKm(getSafeNumber(treino.distanciaKm));
            setDuracaoMin(treino.duracaoMin ? getSafeNumber(treino.duracaoMin) : '');
            setComentario('');
            setPercepcaoEsforco(5);
            setRitmoMedio('');
            setFcMedia('');
            setFcMax('');
            setCadenciaMedia('');
            setPotenciaMedia('');
            setElevacaoTotalMetros('');
        }
    }, [treino, open]);

    const handleClose = () => {
        // Reset de todos os campos
        setDataTreino(new Date().toISOString().split('T')[0]);
        setDistanciaKm(0);
        setDuracaoMin('');
        setComentario('');
        setPercepcaoEsforco(5);
        setRitmoMedio('');
        setFcMedia('');
        setFcMax('');
        setCadenciaMedia('');
        setPotenciaMedia('');
        setElevacaoTotalMetros('');
        onClose();
    };

    const handleMarcarComoRealizado = async () => {
        if (!treino?.id) return;

        console.log('=== DEBUG FORMULÁRIO CONCLUSÃO ===');
        console.log('treino:', treino);
        console.log('Estados do formulário:');
        console.log('- dataTreino:', dataTreino);
        console.log('- distanciaKm:', distanciaKm);
        console.log('- duracaoMin:', duracaoMin);
        console.log('- comentario:', comentario);
        console.log('- percepcaoEsforco:', percepcaoEsforco);
        console.log('- ritmoMedio:', ritmoMedio);
        console.log('- fcMedia:', fcMedia);
        console.log('- fcMax:', fcMax);
        console.log('- cadenciaMedia:', cadenciaMedia);
        console.log('- potenciaMedia:', potenciaMedia);
        console.log('- elevacaoTotalMetros:', elevacaoTotalMetros);

        setLoadingSave(true);
        try {
            const dadosRealizacao: TreinoRealizado = {
                treinoPlanejadoId: treino.id,
                atletaId: atletaId,
                planoSemanalId: planoSemanalId,
                dataTreino: dataTreino,
                diaSemana: getSafeValue(treino.diaSemana) as string,
                tipoTreino: getSafeValue(treino.tipoTreino) as string,
                distanciaKm: distanciaKm,
                duracaoMin: duracaoMin !== '' ? Number(duracaoMin) : 0,
                fcMedia: fcMedia !== '' ? Number(fcMedia) : 0,
                fcMax: fcMax !== '' ? Number(fcMax) : undefined,
                ritmoMedio: ritmoMedio.trim() || undefined,
                potenciaMedia: potenciaMedia !== '' ? Number(potenciaMedia) : undefined,
                feedbackAtleta: comentario.trim() || undefined,
                fonteDados: 'MANUAL',
                status: 'REALIZADO',
                percepcaoEsforco: typeof percepcaoEsforco === 'number' ? percepcaoEsforco : undefined,
                cadenciaMedia: cadenciaMedia !== '' ? Number(cadenciaMedia) : undefined,
                externalId: undefined,
                tempoExecucaoSegundos: duracaoMin !== '' ? Number(duracaoMin) * 60 : undefined,
                elevacaoGanhoMetros: elevacaoTotalMetros !== '' ? Number(elevacaoTotalMetros) : undefined,
            };

            console.log('Dados enviados para API:', JSON.stringify(dadosRealizacao, null, 2));

            // Chamada para o TreinoService
            const response = await TreinoService.marcarComoRealizado(dadosRealizacao);
            console.log('Resposta do backend após marcar como realizado:', response);

            handleClose();

            // Callback de sucesso
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error('Erro ao marcar treino como realizado:', err);
        } finally {
            setLoadingSave(false);
        }
    };

    // Funções helper para processar dados
    const getSafeValue = (value: any): string | number => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
            return value.value || value.label || value.toString();
        }
        return value;
    };

    const getSafeNumber = (value: any): number => {
        const safeValue = getSafeValue(value);
        return typeof safeValue === 'number' ? safeValue : parseFloat(safeValue as string) || 0;
    };

    if (!treino) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6">
                        Marcar Treino como Realizado
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {/* Informações do treino */}
                <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {getSafeValue(treino.tipoTreino)}
                    </Typography>
                    <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <RunIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                                {getSafeNumber(treino.distanciaKm)} km
                            </Typography>
                        </Box>
                        {treino.duracaoMin && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                    {getSafeNumber(treino.duracaoMin)} min
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                    <Chip
                        label={getSafeValue(treino.diaSemana)}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Card>

                {/* Formulário de conclusão */}
                <Stack spacing={3}>
                    <TextField
                        label="Data de Realização"
                        type="date"
                        value={dataTreino}
                        onChange={(e) => setDataTreino(e.target.value)}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        fullWidth
                        required
                    />

                    {/* Dados do Treino Realizado vs Planejado */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Dados do Treino Realizado
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            Os campos abaixo são pré-preenchidos com os dados planejados, mas podem ser editados conforme o realizado
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Distância (km)"
                                    type="number"
                                    value={distanciaKm}
                                    onChange={(e) => setDistanciaKm(Number(e.target.value))}
                                    fullWidth
                                    required
                                    helperText={`Planejado: ${getSafeNumber(treino.distanciaKm)} km`}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Duração (min)"
                                    type="number"
                                    value={duracaoMin}
                                    onChange={(e) => setDuracaoMin(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    required
                                    helperText={
                                        treino.duracaoMin
                                            ? `Planejado: ${getSafeNumber(treino.duracaoMin)} min`
                                            : 'Não especificado no planejamento'
                                    }
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Elevação Total (m)"
                                    type="number"
                                    value={elevacaoTotalMetros}
                                    onChange={(e) => setElevacaoTotalMetros(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    helperText="Metros acumulados"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Métricas de Performance */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Métricas de Performance
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Percepção de Esforço (1-10)
                                </Typography>
                                <Slider
                                    aria-label="Percepção de Esforço"
                                    value={typeof percepcaoEsforco === 'number' ? percepcaoEsforco : 5}
                                    onChange={(_, newValue) => setPercepcaoEsforco(newValue as number)}
                                    step={1}
                                    marks
                                    min={1}
                                    max={10}
                                    valueLabelDisplay="auto"
                                    sx={{ mt: 1 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Ritmo Médio"
                                    placeholder="5:30 min/km"
                                    value={ritmoMedio}
                                    onChange={(e) => setRitmoMedio(e.target.value)}
                                    fullWidth
                                    required
                                    helperText="Ex: 5:30 min/km"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="FC Média (bpm)"
                                    type="number"
                                    value={fcMedia}
                                    onChange={(e) => setFcMedia(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    required
                                    helperText="Batimentos/min"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="FC Máxima (bpm)"
                                    type="number"
                                    value={fcMax}
                                    onChange={(e) => setFcMax(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    helperText="Batimentos/min"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Cadência Média (spm)"
                                    type="number"
                                    value={cadenciaMedia}
                                    onChange={(e) => setCadenciaMedia(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    helperText="Passos por minuto"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Potência Média (W)"
                                    type="number"
                                    value={potenciaMedia}
                                    onChange={(e) => setPotenciaMedia(e.target.value ? Number(e.target.value) : '')}
                                    fullWidth
                                    helperText="Watts"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <TextField
                        label="Comentários"
                        placeholder="Como foi o treino? Dificuldades, sensações, etc..."
                        multiline
                        rows={3}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        fullWidth
                        helperText="Opcional: Adicione observações sobre como foi a execução do treino"
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    startIcon={<CloseIcon />}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleMarcarComoRealizado}
                    variant="contained"
                    color="success"
                    startIcon={loadingSave ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={loadingSave}
                >
                    {loadingSave ? 'Salvando...' : 'Marcar como Realizado'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TreinoRealizadoDialog;
