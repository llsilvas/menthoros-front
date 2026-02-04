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
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    IconButton,
    Slider
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { TreinoService } from '../../api/services/TreinoService';
import type { TreinoRealizado } from '../../types/TreinoRealizado';
import type { TreinoPlanejado } from '../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber } from '../../utils/safeValues';

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
    const [descricao, setDescricao] = useState('');
    const [zonaAlvo, setZonaAlvo] = useState('');
    const [distanciaKm, setDistanciaKm] = useState(0);
    const [duracaoMin, setDuracaoMin] = useState('');
    const [ritmoAlvo, setRitmoAlvo] = useState('');
    const [ritmoMedio, setRitmoMedio] = useState('');
    const [elevacaoGanhoMetros, setElevacaoGanhoMetros] = useState<number | ''>('');
    const [elevacaoPerdaMetros, setElevacaoPerdaMetros] = useState<number | ''>('');
    const [observacao, setObservacao] = useState('');
    const [fcMedia, setFcMedia] = useState<number | ''>('');
    const [fcMax, setFcMax] = useState<number | ''>('');
    const [cadenciaMedia, setCadenciaMedia] = useState<number | ''>('');
    const [potenciaMedia, setPotenciaMedia] = useState<number | ''>('');
    const [velocidadeMedia, setVelocidadeMedia] = useState<number | ''>('');
    const [percepcaoEsforco, setPercepcaoEsforco] = useState<number | ''>(5);
    const [feedbackAtleta, setFeedbackAtleta] = useState('');
    const [qualidadeSonoNoiteAnterior, setQualidadeSonoNoiteAnterior] = useState<number | ''>(5);
    const [nivelEstresse, setNivelEstresse] = useState<number | ''>(5);

    const getEffortColor = (value: number) => {
        if (value <= 5) return '#66bb6a';
        if (value <= 7) return '#ffcc80';
        if (value <= 9) return '#ff8a65';
        return '#ef5350';
    };

    const gradientSliderSx = {
        '& .MuiSlider-rail': {
            opacity: 1,
            backgroundImage: 'linear-gradient(90deg, #a5d6a7 0%, #ffe0b2 55%, #ef9a9a 100%)',
        },
        '& .MuiSlider-track': {
            backgroundImage: 'linear-gradient(90deg, #a5d6a7 0%, #ffe0b2 55%, #ef9a9a 100%)',
        },
        '& .MuiSlider-thumb': {
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'grey.400',
            boxShadow: 'none',
        },
    } as const;

    const sliderActiveSx = (value: number) => ({
        color: getEffortColor(value),
        '& .MuiSlider-track': {
            backgroundColor: getEffortColor(value),
        },
    });

    // Atualiza os campos quando o treino muda
    React.useEffect(() => {
        if (treino && open) {
            setDataTreino(new Date().toISOString().split('T')[0]);
            setDescricao('');
            setZonaAlvo('');
            setDistanciaKm(getSafeNumber(treino.distanciaKm));
            setDuracaoMin('');
            setRitmoAlvo('');
            setRitmoMedio('');
            setElevacaoGanhoMetros('');
            setElevacaoPerdaMetros('');
            setObservacao('');
            setFcMedia('');
            setFcMax('');
            setCadenciaMedia('');
            setPotenciaMedia('');
            setVelocidadeMedia('');
            setPercepcaoEsforco(5);
            setFeedbackAtleta('');
            setQualidadeSonoNoiteAnterior(5);
            setNivelEstresse(5);
        }
    }, [treino, open]);

    const handleClose = () => {
        // Reset de todos os campos
        setDataTreino(new Date().toISOString().split('T')[0]);
        setDescricao('');
        setZonaAlvo('');
        setDistanciaKm(0);
        setDuracaoMin('');
        setRitmoAlvo('');
        setRitmoMedio('');
        setElevacaoGanhoMetros('');
        setElevacaoPerdaMetros('');
        setObservacao('');
        setFcMedia('');
        setFcMax('');
        setCadenciaMedia('');
        setPotenciaMedia('');
        setVelocidadeMedia('');
        setPercepcaoEsforco(5);
        setFeedbackAtleta('');
        setQualidadeSonoNoiteAnterior(5);
        setNivelEstresse(5);
        onClose();
    };

    const handleMarcarComoRealizado = async () => {
        if (!treino?.id) return;

        console.log('=== DEBUG FORMULÁRIO CONCLUSÃO ===');
        console.log('treino:', treino);
        console.log('Estados do formulário:');
        console.log('- dataTreino:', dataTreino);
        console.log('- descricao:', descricao);
        console.log('- zonaAlvo:', zonaAlvo);
        console.log('- distanciaKm:', distanciaKm);
        console.log('- duracaoMin:', duracaoMin);
        console.log('- ritmoAlvo:', ritmoAlvo);
        console.log('- ritmoMedio:', ritmoMedio);
        console.log('- elevacaoGanhoMetros:', elevacaoGanhoMetros);
        console.log('- elevacaoPerdaMetros:', elevacaoPerdaMetros);
        console.log('- observacao:', observacao);
        console.log('- fcMedia:', fcMedia);
        console.log('- fcMax:', fcMax);
        console.log('- cadenciaMedia:', cadenciaMedia);
        console.log('- potenciaMedia:', potenciaMedia);
        console.log('- velocidadeMedia:', velocidadeMedia);
        console.log('- percepcaoEsforco:', percepcaoEsforco);
        console.log('- feedbackAtleta:', feedbackAtleta);
        console.log('- qualidadeSonoNoiteAnterior:', qualidadeSonoNoiteAnterior);
        console.log('- nivelEstresse:', nivelEstresse);

        setLoadingSave(true);
        try {
            const dadosRealizacao: TreinoRealizado = {
                treinoPlanejadoId: treino.id,
                atletaId: atletaId,
                planoSemanalId: planoSemanalId,
                dataTreino: dataTreino,
                diaSemana: getSafeValue(treino.diaSemana) as string,
                tipoTreino: getSafeValue(treino.tipoTreino) as string,
                descricao: descricao.trim() || undefined,
                zonaAlvo: zonaAlvo.trim() || undefined,
                duracaoMin: duracaoMin,
                distanciaKm: distanciaKm,
                ritmoAlvo: ritmoAlvo.trim() || undefined,
                ritmoMedio: ritmoMedio.trim() || undefined,
                elevacaoGanhoMetros: elevacaoGanhoMetros !== '' ? Number(elevacaoGanhoMetros) : undefined,
                elevacaoPerdaMetros: elevacaoPerdaMetros !== '' ? Number(elevacaoPerdaMetros) : undefined,
                observacao: observacao.trim() || undefined,
                fcMedia: fcMedia !== '' ? Number(fcMedia) : 0,
                fcMax: fcMax !== '' ? Number(fcMax) : undefined,
                cadenciaMedia: cadenciaMedia !== '' ? Number(cadenciaMedia) : undefined,
                potenciaMedia: potenciaMedia !== '' ? Number(potenciaMedia) : undefined,
                velocidadeMedia: velocidadeMedia !== '' ? Number(velocidadeMedia) : undefined,
                percepcaoEsforco: typeof percepcaoEsforco === 'number' ? percepcaoEsforco : undefined,
                feedbackAtleta: feedbackAtleta.trim() || undefined,
                qualidadeSonoNoiteAnterior: typeof qualidadeSonoNoiteAnterior === 'number' ? qualidadeSonoNoiteAnterior : undefined,
                nivelEstresse: typeof nivelEstresse === 'number' ? nivelEstresse : undefined,
                fonteDados: 'MANUAL',
                status: 'REALIZADO',
                externalId: undefined,
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
                <Stack spacing={2}>
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
                        size="small"
                    />

                    {/* Dados do Treino Realizado vs Planejado */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Dados do Treino Realizado
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            Os campos abaixo são pré-preenchidos com os dados planejados, mas podem ser editados conforme o realizado
                        </Typography>

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Descrição do Treino"
                                    placeholder="Ex: 10km com progressão nos últimos 3km"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Zona Alvo"
                                    placeholder="Ex: z2-z3"
                                    value={zonaAlvo}
                                    onChange={(e) => setZonaAlvo(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Distância (km)"
                                    type="number"
                                    value={distanciaKm}
                                    onChange={(e) => setDistanciaKm(Number(e.target.value))}
                                    fullWidth
                                    required
                                    helperText={`Planejado: ${getSafeNumber(treino.distanciaKm)} km`}
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Duração"
                                    placeholder="HH:MM:SS ou MM:SS"
                                    value={duracaoMin}
                                    onChange={(e) => setDuracaoMin(e.target.value)}
                                    fullWidth
                                    required
                                    helperText="Ex: 01:05:30 ou 55:30"
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Ritmo Alvo"
                                    placeholder="5:30 min/km"
                                    value={ritmoAlvo}
                                    onChange={(e) => setRitmoAlvo(e.target.value)}
                                    fullWidth
                                    size="small"
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
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Accordion elevation={0} disableGutters sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                Detalhes avançados
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Elevação Ganho (m)"
                                        type="number"
                                        value={elevacaoGanhoMetros}
                                        onChange={(e) => setElevacaoGanhoMetros(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Elevação Perda (m)"
                                        type="number"
                                        value={elevacaoPerdaMetros}
                                        onChange={(e) => setElevacaoPerdaMetros(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Velocidade Média (km/h)"
                                        type="number"
                                        value={velocidadeMedia}
                                        onChange={(e) => setVelocidadeMedia(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="FC Máxima (bpm)"
                                        type="number"
                                        value={fcMax}
                                        onChange={(e) => setFcMax(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Cadência Média (spm)"
                                        type="number"
                                        value={cadenciaMedia}
                                        onChange={(e) => setCadenciaMedia(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Potência Média (W)"
                                        type="number"
                                        value={potenciaMedia}
                                        onChange={(e) => setPotenciaMedia(e.target.value ? Number(e.target.value) : '')}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Observações Gerais"
                                        placeholder="Ex: Condições climáticas favoráveis"
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Feedback do Atleta */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Feedback do Atleta
                        </Typography>

                        <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderColor: 'grey.200' }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Percepção de Esforço
                                        </Typography>
                                        <Chip
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            label={`${typeof percepcaoEsforco === 'number' ? percepcaoEsforco : 5}/10`}
                                        />
                                    </Box>
                                    <Slider
                                        aria-label="Percepção de Esforço"
                                        value={typeof percepcaoEsforco === 'number' ? percepcaoEsforco : 5}
                                        onChange={(_, newValue) => setPercepcaoEsforco(newValue as number)}
                                        step={1}
                                        marks
                                        min={1}
                                        max={10}
                                        valueLabelDisplay="auto"
                                        sx={{
                                            mt: 0,
                                            ...gradientSliderSx,
                                            ...sliderActiveSx(typeof percepcaoEsforco === 'number' ? percepcaoEsforco : 5),
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Qualidade do Sono (noite anterior)
                                        </Typography>
                                        <Chip
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            label={`${typeof qualidadeSonoNoiteAnterior === 'number' ? qualidadeSonoNoiteAnterior : 5}/10`}
                                        />
                                    </Box>
                                    <Slider
                                        aria-label="Qualidade do Sono"
                                        value={typeof qualidadeSonoNoiteAnterior === 'number' ? qualidadeSonoNoiteAnterior : 5}
                                        onChange={(_, newValue) => setQualidadeSonoNoiteAnterior(newValue as number)}
                                        step={1}
                                        marks
                                        min={1}
                                        max={10}
                                        valueLabelDisplay="auto"
                                        sx={{
                                            mt: 0,
                                            ...gradientSliderSx,
                                            ...sliderActiveSx(typeof qualidadeSonoNoiteAnterior === 'number' ? qualidadeSonoNoiteAnterior : 5),
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Nível de Estresse (pré-treino)
                                        </Typography>
                                        <Chip
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            label={`${typeof nivelEstresse === 'number' ? nivelEstresse : 5}/10`}
                                        />
                                    </Box>
                                    <Slider
                                        aria-label="Nível de Estresse"
                                        value={typeof nivelEstresse === 'number' ? nivelEstresse : 5}
                                        onChange={(_, newValue) => setNivelEstresse(newValue as number)}
                                        step={1}
                                        marks
                                        min={1}
                                        max={10}
                                        valueLabelDisplay="auto"
                                        sx={{
                                            mt: 0,
                                            ...gradientSliderSx,
                                            ...sliderActiveSx(typeof nivelEstresse === 'number' ? nivelEstresse : 5),
                                        }}
                                    />
                                </Box>

                                <Divider />

                                <TextField
                                    label="Comentários do Atleta"
                                    placeholder="Como foi o treino? Dificuldades, sensações, etc..."
                                    multiline
                                    minRows={3}
                                    value={feedbackAtleta}
                                    onChange={(e) => setFeedbackAtleta(e.target.value)}
                                    fullWidth
                                    helperText="Adicione observações sobre como foi a execução do treino"
                                />
                            </Stack>
                        </Card>
                    </Box>
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
