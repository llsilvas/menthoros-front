import { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { elevation } from '../../../shared/design-tokens';
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { useAddTreinoPlanejado } from '../../../hooks/useAddTreinoPlanejado';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload, EtapaInputPayload } from '../../../types/PlanoReview';

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_TREINO = [
    { value: 'FACIL',        label: 'Fácil'         },
    { value: 'CONTINUO',     label: 'Contínuo'      },
    { value: 'LONGO',        label: 'Longo'         },
    { value: 'TEMPO_RUN',    label: 'Tempo Run'     },
    { value: 'INTERVALADO',  label: 'Intervalado'   },
    { value: 'FARTLEK',      label: 'Fartlek'       },
    { value: 'REGENERATIVO', label: 'Regenerativo'  },
    { value: 'TIRO',         label: 'Tiro'          },
    { value: 'SUBIDA',       label: 'Subida'        },
    { value: 'PROVA',        label: 'Prova'         },
];

const TIPOS_ETAPA = [
    'AQUECIMENTO', 'PRINCIPAL', 'INTERVALADO', 'RECUPERACAO', 'DESAQUECIMENTO',
];

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function gerarDatas(semanaInicio: string, semanaFim: string): string[] {
    const datas: string[] = [];
    const inicio = new Date(`${semanaInicio}T00:00:00`);
    const fim    = new Date(`${semanaFim}T00:00:00`);
    for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        datas.push(d.toISOString().slice(0, 10));
    }
    return datas;
}

function formatarDataLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${DIAS_PT[d.getDay()]} ${dia}/${mes}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TreinoAddDialogProps {
    open: boolean;
    planoId: string;
    semanaInicio: string;
    semanaFim: string;
    treinosExistentes: TreinoPlanejadoDto[];
    onClose: () => void;
    onSaved: (treino: TreinoPlanejadoDto) => void;
}

// ── Etapa row ─────────────────────────────────────────────────────────────────

interface EtapaRow {
    tipoEtapa: string;
    duracaoMin: string;
}

const ETAPA_VAZIA: EtapaRow = { tipoEtapa: '', duracaoMin: '' };

// ── Dialog ────────────────────────────────────────────────────────────────────

export function TreinoAddDialog({
    open,
    planoId,
    semanaInicio,
    semanaFim,
    treinosExistentes,
    onClose,
    onSaved,
}: TreinoAddDialogProps) {
    const [tipoTreino, setTipoTreino]   = useState('');
    const [dataTreino, setDataTreino]   = useState('');
    const [distanciaKm, setDistanciaKm] = useState('');
    const [duracaoMin, setDuracaoMin]   = useState('');
    const [zonaAlvo, setZonaAlvo]       = useState('');
    const [rpe, setRpe]                 = useState('');
    const [tss, setTss]                 = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [etapasExpanded, setEtapasExpanded] = useState(false);
    const [etapas, setEtapas]           = useState<EtapaRow[]>([]);
    const [apiError, setApiError]       = useState<string | null>(null);

    const { isSaving, adicionarTreino } = useAddTreinoPlanejado();

    const datas = gerarDatas(semanaInicio, semanaFim);

    const treinosNaData = dataTreino
        ? treinosExistentes.filter((t) => t.dataTreino === dataTreino)
        : [];

    const canSave = tipoTreino.trim() !== '' && dataTreino !== '';

    const handleAdicionarEtapa = () => setEtapas((prev) => [...prev, { ...ETAPA_VAZIA }]);
    const handleRemoverEtapa   = (idx: number) => setEtapas((prev) => prev.filter((_, i) => i !== idx));
    const handleEtapaChange    = (idx: number, field: keyof EtapaRow, value: string) =>
        setEtapas((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

    const handleClose = () => {
        if (isSaving) return;
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setTipoTreino('');
        setDataTreino('');
        setDistanciaKm('');
        setDuracaoMin('');
        setZonaAlvo('');
        setRpe('');
        setTss('');
        setObservacoes('');
        setEtapasExpanded(false);
        setEtapas([]);
        setApiError(null);
    };

    const handleSalvar = async () => {
        if (!canSave) return;
        setApiError(null);

        const payload: TreinoPlanejadoAddPayload = {
            tipoTreino,
            dataTreino,
        };

        if (distanciaKm) payload.distanciaKm = parseFloat(distanciaKm);
        if (duracaoMin)  payload.duracaoMin  = parseInt(duracaoMin, 10);
        if (zonaAlvo)    payload.zonaAlvo    = zonaAlvo;
        if (rpe)         payload.percepcaoEsforcoEsperada = parseInt(rpe, 10);
        if (tss)         payload.tssPlanejado = parseInt(tss, 10);
        if (observacoes) payload.observacoes  = observacoes;

        if (etapasExpanded && etapas.length > 0) {
            payload.etapas = etapas
                .filter((e) => e.tipoEtapa)
                .map((e): EtapaInputPayload => ({
                    tipoEtapa: e.tipoEtapa,
                    duracaoMin: e.duracaoMin ? parseInt(e.duracaoMin, 10) : undefined,
                }));
        }

        try {
            const novoTreino = await adicionarTreino(planoId, payload);
            resetForm();
            onSaved(novoTreino);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Erro ao adicionar treino');
        }
    };

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.82rem',
            color: surface[100],
            bgcolor: 'rgba(255,255,255,0.04)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
            '&.Mui-focused fieldset': { borderColor: primary[500] },
        },
        '& .MuiInputLabel-root': { fontSize: '0.72rem', color: surface[500] },
        '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
        '& .MuiSelect-select': { fontSize: '0.82rem', color: surface[100] },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: elevation.highest,
                    border: `1px solid ${content.cardBorder}`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: surface[50],
                    pb: 1,
                    borderBottom: `1px solid rgba(255,255,255,0.07)`,
                }}
            >
                Adicionar treino
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {/* Campos obrigatórios */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <FormControl fullWidth size="small" sx={fieldSx}>
                        <InputLabel htmlFor="tipo-treino-input" shrink>Tipo de treino</InputLabel>
                        <Select
                            native
                            label="Tipo de treino"
                            value={tipoTreino}
                            onChange={(e) => setTipoTreino(e.target.value as string)}
                            disabled={isSaving}
                            inputProps={{ id: 'tipo-treino-input', 'aria-label': 'Tipo de treino' }}
                        >
                            <option value="" disabled />
                            {TIPOS_TREINO.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" sx={fieldSx}>
                        <InputLabel htmlFor="data-treino-input" shrink>Data do treino</InputLabel>
                        <Select
                            native
                            label="Data do treino"
                            value={dataTreino}
                            onChange={(e) => setDataTreino(e.target.value as string)}
                            disabled={isSaving}
                            inputProps={{ id: 'data-treino-input', 'aria-label': 'Data do treino' }}
                        >
                            <option value="" disabled />
                            {datas.map((d) => (
                                <option key={d} value={d}>{formatarDataLabel(d)}</option>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Aviso double-day */}
                {treinosNaData.length > 0 && (
                    <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{
                            fontSize: '0.75rem',
                            borderColor: `${semantic.warning[500]}50`,
                            '& .MuiAlert-message': { fontSize: '0.75rem' },
                        }}
                    >
                        Já existe {treinosNaData.length} treino(s) nesta data. Double-day é permitido — confirme se é intencional.
                    </Alert>
                )}

                {/* Campos opcionais */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label="Distância (km)"
                        type="number"
                        value={distanciaKm}
                        onChange={(e) => setDistanciaKm(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={fieldSx}
                    />
                    <TextField
                        label="Duração (min)"
                        type="number"
                        value={duracaoMin}
                        onChange={(e) => setDuracaoMin(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, step: 1 }}
                        sx={fieldSx}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        label="Zona alvo"
                        value={zonaAlvo}
                        onChange={(e) => setZonaAlvo(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                    />
                    <TextField
                        label="RPE (1–10)"
                        type="number"
                        value={rpe}
                        onChange={(e) => setRpe(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, max: 10, step: 1 }}
                        sx={fieldSx}
                    />
                    <TextField
                        label="TSS (opcional)"
                        type="number"
                        value={tss}
                        onChange={(e) => setTss(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, step: 1 }}
                        sx={fieldSx}
                    />
                </Box>

                <TextField
                    label="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    disabled={isSaving}
                    multiline
                    rows={2}
                    fullWidth
                    inputProps={{ maxLength: 500 }}
                    sx={fieldSx}
                />

                {/* Seção de etapas */}
                <Box sx={{ pt: 0.5 }}>
                    <Button
                        size="small"
                        variant="text"
                        onClick={() => setEtapasExpanded((prev) => !prev)}
                        disabled={isSaving}
                        aria-label={etapasExpanded ? 'Ocultar etapas' : 'Adicionar etapas'}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            color: surface[500],
                            px: 0,
                            '&:hover': { color: primary[500], bgcolor: 'transparent' },
                        }}
                    >
                        {etapasExpanded ? '▾ Ocultar etapas' : '▸ Adicionar etapas'}
                    </Button>

                    {etapasExpanded && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {etapas.map((etapa, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <FormControl size="small" sx={{ minWidth: 140, ...fieldSx }}>
                                        <InputLabel>Tipo de etapa</InputLabel>
                                        <Select
                                            label="Tipo de etapa"
                                            value={etapa.tipoEtapa}
                                            onChange={(e) => handleEtapaChange(idx, 'tipoEtapa', e.target.value)}
                                            disabled={isSaving}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: elevation.highest } } }}
                                        >
                                            {TIPOS_ETAPA.map((t) => (
                                                <MenuItem key={t} value={t} sx={{ fontSize: '0.78rem' }}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Duração (min)"
                                        type="number"
                                        value={etapa.duracaoMin}
                                        onChange={(e) => handleEtapaChange(idx, 'duracaoMin', e.target.value)}
                                        disabled={isSaving}
                                        size="small"
                                        sx={{ flex: 1, ...fieldSx }}
                                        inputProps={{ min: 1, step: 1 }}
                                    />
                                    <IconButton
                                        size="small"
                                        aria-label="Remover etapa"
                                        onClick={() => handleRemoverEtapa(idx)}
                                        disabled={isSaving}
                                        sx={{ color: semantic.danger[500], '&:hover': { color: semantic.danger[700] } }}
                                    >
                                        <RemoveIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                onClick={handleAdicionarEtapa}
                                disabled={isSaving}
                                aria-label="Adicionar etapa"
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.72rem',
                                    color: primary[500],
                                    px: 0,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                Adicionar etapa
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Erro da API */}
                {apiError && (
                    <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
                        {apiError}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
                <Button
                    variant="text"
                    onClick={handleClose}
                    disabled={isSaving}
                    sx={{ color: surface[400], textTransform: 'none', fontSize: '0.8rem' }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSalvar}
                    disabled={!canSave || isSaving}
                    aria-label="Salvar treino"
                    sx={{
                        bgcolor: primary[500],
                        color: surface[900],
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2.5,
                        '&:hover': { bgcolor: primary[400] },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                    }}
                >
                    {isSaving
                        ? <CircularProgress size={14} sx={{ color: surface[900] }} />
                        : 'Salvar treino'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
