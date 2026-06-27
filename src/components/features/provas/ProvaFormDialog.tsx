import React, { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    MenuItem,
    Alert,
    Typography,
    Box,
    Chip,
    Stack,
    FormControlLabel,
    Checkbox,
    Divider,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { primary, surface, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { CoachDialog } from '../../../features/coach/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../features/coach/components/actionButtonSx';
import type {
    Prova,
    CreateProva,
    UpdateProva,
    TipoProva,
    DistanciaProva,
    ProvaStatus,
} from '../../../types/Prova';
import {
    TIPO_PROVA_LABELS,
    DISTANCIA_PROVA_LABELS,
    PROVA_STATUS_LABELS,
    extractTipoKey,
    extractDistanciaKey,
    extractStatusKey,
} from '../../../types/Prova';

interface FormErrors {
    nomeProva?: string;
    dataProva?: string;
    distancia?: string;
    percepcaoEsforcoProva?: string;
    feedbackProva?: string;
}

interface ProvaFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateProva | UpdateProva) => Promise<void>;
    prova?: Prova;
}

const getInitialFormData = (prova?: Prova): CreateProva => ({
    nomeProva: prova?.nomeProva ?? '',
    dataProva: prova?.dataProva ?? '',
    tipoProva: extractTipoKey(prova?.tipoProva) ?? 'CORRIDA_RUA',
    distancia: extractDistanciaKey(prova?.distancia) ?? 'KM_42',
    distanciaKm: prova?.distanciaKm ?? undefined,
    provaAlvo: prova?.provaAlvo ?? false,
    statusProva: extractStatusKey(prova?.statusProva) ?? 'PLANEJADA',
    tempoObjetivo: prova?.tempoObjetivo ?? '',
    paceObjetivo: prova?.paceObjetivo ?? undefined,
    tsbIdealProva: prova?.tsbIdealProva ?? undefined,
    foiRealizada: prova?.foiRealizada ?? false,
    tempoRealizado: prova?.tempoRealizado ?? '',
    posicaoGeral: prova?.posicaoGeral ?? undefined,
    posicaoCategoria: prova?.posicaoCategoria ?? undefined,
    tssProva: prova?.tssProva ?? undefined,
    percepcaoEsforcoProva: prova?.percepcaoEsforcoProva ?? undefined,
    feedbackProva: prova?.feedbackProva ?? '',
    semanasPreparacao: prova?.semanasPreparacao ?? undefined,
    inicioPreparacao: prova?.inicioPreparacao ?? '',
});

const ProvaFormDialog: React.FC<ProvaFormDialogProps> = ({ open, onClose, onSave, prova }) => {
    const isEditMode = Boolean(prova);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [formData, setFormData] = useState<CreateProva>(getInitialFormData(prova));
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(getInitialFormData(prova));
        setErrors({});
        setSubmitError(null);
    }, [prova, open]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        const newValue = type === 'checkbox' ? checked
            : type === 'number' ? (value === '' ? undefined : Number(value))
            : value || undefined;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (submitError) setSubmitError(null);
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.nomeProva?.trim()) newErrors.nomeProva = 'Nome da prova é obrigatório';
        if (!formData.dataProva) newErrors.dataProva = 'Data da prova é obrigatória';
        if (!formData.distancia) newErrors.distancia = 'Distância é obrigatória';
        if (formData.percepcaoEsforcoProva !== undefined) {
            const rpe = Number(formData.percepcaoEsforcoProva);
            if (rpe < 1 || rpe > 10) newErrors.percepcaoEsforcoProva = 'Deve ser entre 1 e 10';
        }
        if (formData.feedbackProva && formData.feedbackProva.length > 2000) {
            newErrors.feedbackProva = 'Máximo 2000 caracteres';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        if (!validateForm()) return;

        // Limpar campos vazios para não enviar strings vazias
        const payload: CreateProva = {
            ...formData,
            tempoObjetivo: formData.tempoObjetivo || undefined,
            tempoRealizado: formData.tempoRealizado || undefined,
            feedbackProva: formData.feedbackProva || undefined,
            inicioPreparacao: formData.inicioPreparacao || undefined,
        };

        setLoading(true);
        setSubmitError(null);
        try {
            if (isEditMode && prova) {
                await onSave({ ...payload, id: prova.id } as UpdateProva);
            } else {
                await onSave(payload);
            }
            handleClose();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar prova');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    const provaChip = (
        <Chip
            label={isEditMode ? 'Edição' : 'Cadastro'}
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
            disableClose={loading}
            chip={provaChip}
            title={isEditMode ? 'Editar Prova' : 'Nova Prova'}
            subtitle="Cadastre prova, objetivos e resultado no mesmo padrão visual aplicado aos demais dialogs."
            component="form"
            onSubmit={handleSubmit}
            dividers
            contentSx={{
                p: 0,
                background: `radial-gradient(circle at top right, ${primary[500]}14, transparent 24%), linear-gradient(180deg, ${elevation.base} 0%, ${elevation.panel} 100%)`,
            }}
            actionsHint={
                <Typography variant="caption" sx={{ color: surface[400] }}>
                    Estrutura visual padronizada com atleta, planos, detalhes e provas.
                </Typography>
            }
            actions={
                <>
                    <Button onClick={handleClose} disabled={loading} size="small" fullWidth={isMobile} sx={{ ...GHOST_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading} size="small" fullWidth={isMobile} sx={{ ...PRIMARY_BTN_SX, fontSize: { xs: '0.8rem', md: '0.875rem' }, minHeight: { xs: 40, md: 32 } }}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </>
            }
        >
                    <Stack spacing={2.5} sx={{ p: { xs: 1.5, md: 3 } }}>
                        {submitError && (
                            <Alert severity="error">
                                {submitError}
                            </Alert>
                        )}

                        <Box
                            sx={{
                                borderRadius: 1,
                                border: `1px solid ${content.cardBorder}`,
                                background: elevation.card,
                                p: { xs: 2, md: 2.5 },
                            }}
                        >

                    {/* ── Informações Básicas ── */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Informações Básicas
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 2 }}>
                        <Grid size={8}>
                            <TextField
                                label="Nome da Prova"
                                name="nomeProva"
                                value={formData.nomeProva}
                                onChange={handleChange}
                                error={Boolean(errors.nomeProva)}
                                helperText={errors.nomeProva}
                                fullWidth
                                required
                                size="small"
                                inputProps={{ maxLength: 200 }}
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                label="Data da Prova"
                                name="dataProva"
                                type="date"
                                value={formData.dataProva}
                                onChange={handleChange}
                                error={Boolean(errors.dataProva)}
                                helperText={errors.dataProva}
                                fullWidth
                                required
                                size="small"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                select
                                label="Tipo de Prova"
                                name="tipoProva"
                                value={formData.tipoProva ?? ''}
                                onChange={handleChange}
                                fullWidth
                                required
                                size="small"
                            >
                                {(Object.keys(TIPO_PROVA_LABELS) as TipoProva[]).map(tipo => (
                                    <MenuItem key={tipo} value={tipo}>
                                        {TIPO_PROVA_LABELS[tipo]}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                select
                                label="Distância"
                                name="distancia"
                                value={formData.distancia ?? ''}
                                onChange={handleChange}
                                error={Boolean(errors.distancia)}
                                helperText={errors.distancia}
                                fullWidth
                                required
                                size="small"
                            >
                                {(Object.keys(DISTANCIA_PROVA_LABELS) as DistanciaProva[]).map(dist => (
                                    <MenuItem key={dist} value={dist}>
                                        {DISTANCIA_PROVA_LABELS[dist]}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                label="Distância customizada (km)"
                                name="distanciaKm"
                                type="number"
                                value={formData.distanciaKm ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: '0.001', min: 0 } }}
                                helperText="Para distâncias não listadas"
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                select
                                label="Status"
                                name="statusProva"
                                value={formData.statusProva ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                            >
                                {(Object.keys(PROVA_STATUS_LABELS) as ProvaStatus[]).map(status => (
                                    <MenuItem key={status} value={status}>
                                        {PROVA_STATUS_LABELS[status]}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.provaAlvo ?? false}
                                        onChange={handleChange}
                                        name="provaAlvo"
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Prova alvo da temporada
                                    </Typography>
                                }
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2 }} />

                    {/* ── Objetivos ── */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Objetivos
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 2 }}>
                        <Grid size={3}>
                            <TextField
                                label="Tempo objetivo"
                                name="tempoObjetivo"
                                type="time"
                                value={formData.tempoObjetivo ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                helperText="HH:mm:ss"
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                            />
                        </Grid>
                        <Grid size={3}>
                            <TextField
                                label="Pace objetivo (min/km)"
                                name="paceObjetivo"
                                type="number"
                                value={formData.paceObjetivo ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                                helperText="Ex: 4.50"
                            />
                        </Grid>
                        <Grid size={3}>
                            <TextField
                                label="TSB ideal no dia"
                                name="tsbIdealProva"
                                type="number"
                                value={formData.tsbIdealProva ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { step: '0.1' } }}
                                helperText="Ex: 7.0"
                            />
                        </Grid>
                        <Grid size={3}>
                            <TextField
                                label="Semanas de preparação"
                                name="semanasPreparacao"
                                type="number"
                                value={formData.semanasPreparacao ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { min: 1, max: 52 } }}
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField
                                label="Início da preparação"
                                name="inicioPreparacao"
                                type="date"
                                value={formData.inicioPreparacao ?? ''}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2 }} />

                    {/* ── Resultado ── */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Resultado
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        <Grid size={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.foiRealizada ?? false}
                                        onChange={handleChange}
                                        name="foiRealizada"
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2">Prova já foi realizada</Typography>
                                }
                            />
                        </Grid>
                        {formData.foiRealizada && (
                            <>
                                <Grid size={3}>
                                    <TextField
                                        label="Tempo realizado"
                                        name="tempoRealizado"
                                        type="time"
                                        value={formData.tempoRealizado ?? ''}
                                        onChange={handleChange}
                                        fullWidth
                                        size="small"
                                        helperText="HH:mm:ss"
                                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1 } }}
                                    />
                                </Grid>
                                <Grid size={3}>
                                    <TextField
                                        label="Posição geral"
                                        name="posicaoGeral"
                                        type="number"
                                        value={formData.posicaoGeral ?? ''}
                                        onChange={handleChange}
                                        fullWidth
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1 } }}
                                    />
                                </Grid>
                                <Grid size={3}>
                                    <TextField
                                        label="Posição na categoria"
                                        name="posicaoCategoria"
                                        type="number"
                                        value={formData.posicaoCategoria ?? ''}
                                        onChange={handleChange}
                                        fullWidth
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1 } }}
                                    />
                                </Grid>
                                <Grid size={3}>
                                    <TextField
                                        label="TSS da prova"
                                        name="tssProva"
                                        type="number"
                                        value={formData.tssProva ?? ''}
                                        onChange={handleChange}
                                        fullWidth
                                        size="small"
                                        slotProps={{ htmlInput: { min: 0 } }}
                                    />
                                </Grid>
                                <Grid size={3}>
                                    <TextField
                                        label="Percepção de esforço (1–10)"
                                        name="percepcaoEsforcoProva"
                                        type="number"
                                        value={formData.percepcaoEsforcoProva ?? ''}
                                        onChange={handleChange}
                                        error={Boolean(errors.percepcaoEsforcoProva)}
                                        helperText={errors.percepcaoEsforcoProva}
                                        fullWidth
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                    />
                                </Grid>
                                <Grid size={9}>
                                    <TextField
                                        label="Feedback da prova"
                                        name="feedbackProva"
                                        value={formData.feedbackProva ?? ''}
                                        onChange={handleChange}
                                        error={Boolean(errors.feedbackProva)}
                                        helperText={errors.feedbackProva ?? `${(formData.feedbackProva ?? '').length}/2000`}
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={3}
                                        inputProps={{ maxLength: 2000 }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                        </Box>
                    </Stack>
        </CoachDialog>
    );
};

export default ProvaFormDialog;
