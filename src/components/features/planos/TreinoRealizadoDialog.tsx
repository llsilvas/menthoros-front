import React, { useState } from 'react';
import {
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
    Slider,
    MenuItem,
    useMediaQuery,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    DirectionsRun as RunIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    FitnessCenterOutlined as EtapasIcon
} from '@mui/icons-material';
import { TreinoService } from '../../../api/services/TreinoService';
import type { TreinoRealizado, EtapaRealizadaInput } from '../../../types/TreinoRealizado';
import { TIPO_ETAPA_OPTIONS, criarEtapasFromPlanejadas } from '../../../types/TreinoRealizado';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { useTheme } from '@mui/material/styles';
import { primary, surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { effortColor, EFFORT_GRADIENT } from '../../../features/coach/theme/workoutColors';
import { CoachDialog } from '../../../features/coach/components/CoachDialog';
import { GHOST_BTN_SX, SUCCESS_BTN_SX } from '../../../features/coach/components/actionButtonSx';

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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    const [etapasRealizadas, setEtapasRealizadas] = useState<EtapaRealizadaInput[]>([]);

    const gradientSliderSx = {
        '& .MuiSlider-rail': {
            opacity: 1,
            backgroundImage: EFFORT_GRADIENT,
        },
        '& .MuiSlider-track': {
            backgroundImage: EFFORT_GRADIENT,
        },
        '& .MuiSlider-thumb': {
            bgcolor: elevation.card,
            border: `2px solid ${surface[500]}`,
            boxShadow: 'none',
        },
    } as const;

    const sliderActiveSx = (value: number) => ({
        color: effortColor(value),
        '& .MuiSlider-track': {
            backgroundColor: effortColor(value),
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
            if (treino.etapas && treino.etapas.length > 0) {
                setEtapasRealizadas(criarEtapasFromPlanejadas(treino.etapas));
            } else {
                setEtapasRealizadas([]);
            }
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
        setEtapasRealizadas([]);
        onClose();
    };

    const createEmptyEtapa = (): EtapaRealizadaInput => ({
        ordem: etapasRealizadas.length + 1,
        tipoEtapa: 'PRINCIPAL',
        descricao: '',
        duracao: '',
        distanciaKm: undefined,
        fcMedia: undefined,
        paceMedia: '',
        percepcaoEsforco: undefined,
        observacao: '',
    });

    const handleAddEtapa = () => {
        setEtapasRealizadas(prev => [...prev, createEmptyEtapa()]);
    };

    const handleRemoveEtapa = (index: number) => {
        setEtapasRealizadas(prev => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((etapa, i) => ({ ...etapa, ordem: i + 1 }));
        });
    };

    const handleUpdateEtapa = (index: number, field: keyof EtapaRealizadaInput, value: unknown) => {
        setEtapasRealizadas(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
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
                etapasRealizadas: etapasRealizadas.length > 0
                    ? etapasRealizadas.map((etapaRealizada, index) => {
                        const { _planejado, ...etapa } = etapaRealizada;
                        void _planejado;

                        return {
                            ...etapa,
                            ordem: index + 1,
                            descricao: etapa.descricao?.trim() || undefined,
                            duracao: etapa.duracao?.trim() || undefined,
                            paceMedia: etapa.paceMedia?.trim() || undefined,
                            observacao: etapa.observacao?.trim() || undefined,
                            distanciaKm: etapa.distanciaKm || undefined,
                            fcMedia: etapa.fcMedia || undefined,
                            fcMax: etapa.fcMax || undefined,
                            percepcaoEsforco: etapa.percepcaoEsforco || undefined,
                            cadenciaMedia: etapa.cadenciaMedia || undefined,
                            potenciaMedia: etapa.potenciaMedia || undefined,
                            velocidadeMedia: etapa.velocidadeMedia || undefined,
                        };
                    })
                    : undefined,
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

    if (!treino) return null;

    const conclusaoChip = (
        <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important', color: `${primary[500]} !important` }} />}
            label="Conclusão de treino"
            size="small"
            sx={{
                bgcolor: content.cardBgHover,
                color: surface[200],
                fontWeight: 700,
                border: `1px solid ${content.cardBorder}`,
            }}
        />
    );

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            chip={conclusaoChip}
            title="Marcar Treino como Realizado"
            subtitle="Registre dados executados, etapas e feedback do atleta dentro do mesmo padrão visual dos dialogs de treino."
            contentSx={{ p: 0, background: elevation.base }}
            actionsHint={
                <Typography variant="caption" sx={{ color: surface[400] }}>
                    Mesmo dimensionamento e linguagem visual dos demais dialogs do fluxo.
                </Typography>
            }
            actions={
                <>
                    <Button
                        onClick={handleClose}
                        startIcon={<CloseIcon />}
                        size="small"
                        fullWidth={isMobile}
                        sx={{ ...GHOST_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleMarcarComoRealizado}
                        variant="contained"
                        startIcon={loadingSave ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        disabled={loadingSave}
                        size="small"
                        fullWidth={isMobile}
                        sx={{ ...SUCCESS_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}
                    >
                        {loadingSave ? 'Salvando...' : 'Marcar como Realizado'}
                    </Button>
                </>
            }
        >
                <Stack spacing={2.5} sx={{ p: { xs: 1.5, md: 3 } }}>
                {/* Informações do treino */}
                <Card
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 1,
                        borderColor: content.cardBorder,
                        bgcolor: elevation.card,
                    }}
                >
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

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Ritmo Médio"
                                    placeholder="5:30 min/km"
                                    value={ritmoMedio}
                                    onChange={(e) => setRitmoMedio(e.target.value)}
                                    fullWidth
                                    required
                                    helperText="Ex: 5:30 min/km"
                                    size="small"
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

                    <Accordion elevation={0} disableGutters sx={{ border: '1px solid', borderColor: content.cardBorder }}>
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

                    {/* Etapas do Treino Realizado */}
                    <Accordion
                        elevation={0}
                        disableGutters
                        sx={{ border: '1px solid', borderColor: content.cardBorder }}
                        defaultExpanded={etapasRealizadas.length > 0}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EtapasIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    Etapas do Treino
                                </Typography>
                                {etapasRealizadas.length > 0 && (
                                    <Chip
                                        label={etapasRealizadas.length}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                    Detalhe cada etapa do treino (aquecimento, tiros, recuperação, etc.)
                                </Typography>

                                {etapasRealizadas.map((etapa, index) => {
                                    const tipoOpt = TIPO_ETAPA_OPTIONS.find(o => o.value === etapa.tipoEtapa);
                                    const tipoColor = tipoOpt?.color || surface[400];
                                    const ref = etapa._planejado;

                                    return (
                                        <Card
                                            key={index}
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                borderLeft: '4px solid',
                                                borderLeftColor: tipoColor,
                                            }}
                                        >
                                            {/* Linha 1: Ordem + Tipo + Descrição (labels) + Delete */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: ref ? 0.5 : 1.5 }}>
                                                <Chip
                                                    label={`#${etapa.ordem}`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: 32,
                                                        bgcolor: tipoColor,
                                                        color: 'white',
                                                    }}
                                                />
                                                <TextField
                                                    select
                                                    value={etapa.tipoEtapa || ''}
                                                    onChange={(e) => handleUpdateEtapa(index, 'tipoEtapa', e.target.value)}
                                                    size="small"
                                                    variant="standard"
                                                    sx={{ minWidth: 130 }}
                                                    slotProps={{ input: { disableUnderline: true, sx: { fontWeight: 600, fontSize: '0.85rem' } } }}
                                                >
                                                    {TIPO_ETAPA_OPTIONS.map(opt => (
                                                        <MenuItem key={opt.value} value={opt.value}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: opt.color }} />
                                                                {opt.label}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                                {etapa.descricao && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }} noWrap>
                                                        {etapa.descricao}
                                                    </Typography>
                                                )}
                                                <IconButton
                                                    onClick={() => handleRemoveEtapa(index)}
                                                    size="small"
                                                    color="error"
                                                    sx={{ ml: 'auto' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>

                                            {/* Linha 2: Referência do planejado */}
                                            {ref && (
                                                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                                                    {ref.duracaoMin != null && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Duração: <b>{ref.duracaoMin} min</b>
                                                        </Typography>
                                                    )}
                                                    {ref.distanciaKm != null && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Dist: <b>{ref.distanciaKm} km</b>
                                                        </Typography>
                                                    )}
                                                    {ref.ritmoAlvo && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Ritmo: <b>{ref.ritmoAlvo}</b>
                                                        </Typography>
                                                    )}
                                                    {ref.fcAlvoEtapa && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            FC: <b>{ref.fcAlvoEtapa}</b>
                                                        </Typography>
                                                    )}
                                                    {ref.repeticoes != null && ref.repeticoes > 1 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Rep: <b>{ref.repeticoes}x</b>
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Linha 3: Campos editáveis compactos */}
                                            <Grid container spacing={1}>
                                                <Grid size={{ xs: 6, sm: 4 }}>
                                                    <TextField
                                                        label="Duração"
                                                        placeholder="MM:SS"
                                                        value={etapa.duracao || ''}
                                                        onChange={(e) => handleUpdateEtapa(index, 'duracao', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 4 }}>
                                                    <TextField
                                                        label="Distância (km)"
                                                        type="number"
                                                        value={etapa.distanciaKm ?? ''}
                                                        onChange={(e) => handleUpdateEtapa(
                                                            index, 'distanciaKm',
                                                            e.target.value ? Number(e.target.value) : undefined
                                                        )}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 4 }}>
                                                    <TextField
                                                        label="FC Média"
                                                        type="number"
                                                        value={etapa.fcMedia ?? ''}
                                                        onChange={(e) => handleUpdateEtapa(
                                                            index, 'fcMedia',
                                                            e.target.value ? Number(e.target.value) : undefined
                                                        )}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 4 }}>
                                                    <TextField
                                                        label="Pace Médio"
                                                        placeholder="MM:SS"
                                                        value={etapa.paceMedia || ''}
                                                        onChange={(e) => handleUpdateEtapa(index, 'paceMedia', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 6, sm: 4 }}>
                                                    <TextField
                                                        label="RPE (1-10)"
                                                        type="number"
                                                        value={etapa.percepcaoEsforco ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                                            if (val === undefined || (val >= 1 && val <= 10)) {
                                                                handleUpdateEtapa(index, 'percepcaoEsforco', val);
                                                            }
                                                        }}
                                                        size="small"
                                                        fullWidth
                                                        slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Card>
                                    );
                                })}

                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddEtapa}
                                    variant="outlined"
                                    size="small"
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Adicionar Etapa
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Feedback do Atleta */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Feedback do Atleta
                        </Typography>

                        <Card
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: elevation.card,
                                borderColor: content.cardBorder,
                            }}
                        >
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
                </Stack>
        </CoachDialog>
    );
};

export default TreinoRealizadoDialog;
