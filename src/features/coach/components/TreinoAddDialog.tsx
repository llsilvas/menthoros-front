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
    Select,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RepeatIcon from '@mui/icons-material/Repeat';
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

// ── Tipos de etapa/bloco ──────────────────────────────────────────────────────

interface StepRow {
    kind: 'step';
    tipoEtapa: string;
    duracaoMin: string;
}

interface SubStep {
    tipoEtapa: string;
    duracaoMin: string;
}

interface BlockRow {
    kind: 'block';
    repeticoes: string;
    steps: SubStep[];
}

type EtapaItem = StepRow | BlockRow;

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

function serializarItens(itens: EtapaItem[]): EtapaInputPayload[] {
    return itens
        .map((item): EtapaInputPayload | null => {
            if (item.kind === 'block') {
                const subEtapas = item.steps
                    .filter((s) => s.tipoEtapa)
                    .map((s) => ({
                        tipoEtapa: s.tipoEtapa,
                        duracaoMin: s.duracaoMin ? parseInt(s.duracaoMin, 10) : undefined,
                    }));
                if (!subEtapas.length) return null;
                return {
                    tipoEtapa: 'BLOCO',
                    blocoRepeticoes: parseInt(item.repeticoes, 10) || 1,
                    subEtapas,
                };
            }
            if (!item.tipoEtapa) return null;
            return {
                tipoEtapa: item.tipoEtapa,
                duracaoMin: item.duracaoMin ? parseInt(item.duracaoMin, 10) : undefined,
            };
        })
        .filter((e): e is EtapaInputPayload => e !== null);
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
    const [itens, setItens]             = useState<EtapaItem[]>([]);
    const [apiError, setApiError]       = useState<string | null>(null);

    const { isSaving, adicionarTreino } = useAddTreinoPlanejado();

    const datas = gerarDatas(semanaInicio, semanaFim);

    const treinosNaData = dataTreino
        ? treinosExistentes.filter((t) => t.dataTreino === dataTreino)
        : [];

    const canSave = tipoTreino.trim() !== '' && dataTreino !== '';

    // ── Manipuladores de itens ────────────────────────────────────────────────

    const handleAdicionarEtapaSimples = () =>
        setItens((prev) => [...prev, { kind: 'step', tipoEtapa: '', duracaoMin: '' }]);

    const handleAdicionarBloco = () =>
        setItens((prev) => [...prev, { kind: 'block', repeticoes: '2', steps: [{ tipoEtapa: '', duracaoMin: '' }] }]);

    const handleRemoverItem = (idx: number) =>
        setItens((prev) => prev.filter((_, i) => i !== idx));

    const handleStepChange = (idx: number, field: 'tipoEtapa' | 'duracaoMin', value: string) =>
        setItens((prev) => prev.map((item, i) => {
            if (i !== idx || item.kind !== 'step') return item;
            return { ...item, [field]: value };
        }));

    const handleBlocoRepeticoesChange = (idx: number, value: string) =>
        setItens((prev) => prev.map((item, i) => {
            if (i !== idx || item.kind !== 'block') return item;
            return { ...item, repeticoes: value };
        }));

    const handleAdicionarSubStep = (blocoIdx: number) =>
        setItens((prev) => prev.map((item, i) => {
            if (i !== blocoIdx || item.kind !== 'block') return item;
            return { ...item, steps: [...item.steps, { tipoEtapa: '', duracaoMin: '' }] };
        }));

    const handleRemoverSubStep = (blocoIdx: number, stepIdx: number) =>
        setItens((prev) => prev.map((item, i) => {
            if (i !== blocoIdx || item.kind !== 'block') return item;
            return { ...item, steps: item.steps.filter((_, si) => si !== stepIdx) };
        }));

    const handleSubStepChange = (blocoIdx: number, stepIdx: number, field: 'tipoEtapa' | 'duracaoMin', value: string) =>
        setItens((prev) => prev.map((item, i) => {
            if (i !== blocoIdx || item.kind !== 'block') return item;
            return {
                ...item,
                steps: item.steps.map((s, si) => si === stepIdx ? { ...s, [field]: value } : s),
            };
        }));

    // ── Fechar / reset ────────────────────────────────────────────────────────

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
        setItens([]);
        setApiError(null);
    };

    // ── Salvar ────────────────────────────────────────────────────────────────

    const handleSalvar = async () => {
        if (!canSave) return;
        setApiError(null);

        const payload: TreinoPlanejadoAddPayload = { tipoTreino, dataTreino };

        if (distanciaKm) payload.distanciaKm = parseFloat(distanciaKm);
        if (duracaoMin)  payload.duracaoMin  = parseInt(duracaoMin, 10);
        if (zonaAlvo)    payload.zonaAlvo    = zonaAlvo;
        if (rpe)         payload.percepcaoEsforcoEsperada = parseInt(rpe, 10);
        if (tss)         payload.tssPlanejado = parseInt(tss, 10);
        if (observacoes) payload.observacoes  = observacoes;

        if (etapasExpanded && itens.length > 0) {
            const etapas = serializarItens(itens);
            if (etapas.length > 0) payload.etapas = etapas;
        }

        try {
            const novoTreino = await adicionarTreino(planoId, payload);
            resetForm();
            onSaved(novoTreino);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Erro ao adicionar treino');
        }
    };

    // ── Estilos ───────────────────────────────────────────────────────────────

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

    const nativeSelectSx = {
        ...fieldSx,
        '& select': { fontSize: '0.82rem', color: surface[100], bgcolor: 'transparent' },
    } as const;

    // ── Render ────────────────────────────────────────────────────────────────

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
                    <FormControl fullWidth size="small" sx={nativeSelectSx}>
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

                    <FormControl fullWidth size="small" sx={nativeSelectSx}>
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

                            {/* Lista de itens (etapas avulsas + blocos) */}
                            {itens.map((item, idx) =>
                                item.kind === 'step' ? (
                                    /* ── Etapa avulsa ── */
                                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <FormControl size="small" sx={{ minWidth: 150, ...nativeSelectSx }}>
                                            <InputLabel shrink>Tipo</InputLabel>
                                            <Select
                                                native
                                                label="Tipo"
                                                value={item.tipoEtapa}
                                                onChange={(e) => handleStepChange(idx, 'tipoEtapa', e.target.value as string)}
                                                disabled={isSaving}
                                                inputProps={{ 'aria-label': `Tipo da etapa ${idx + 1}` }}
                                            >
                                                <option value="" disabled />
                                                {TIPOS_ETAPA.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            value={item.duracaoMin}
                                            onChange={(e) => handleStepChange(idx, 'duracaoMin', e.target.value)}
                                            disabled={isSaving}
                                            size="small"
                                            sx={{ width: 72, ...fieldSx }}
                                            inputProps={{ min: 1, step: 1, 'aria-label': `Duração da etapa ${idx + 1}` }}
                                        />
                                        <IconButton
                                            size="small"
                                            aria-label={`Remover etapa ${idx + 1}`}
                                            onClick={() => handleRemoverItem(idx)}
                                            disabled={isSaving}
                                            sx={{ color: semantic.danger[500], '&:hover': { color: semantic.danger[700] } }}
                                        >
                                            <RemoveIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    /* ── Bloco repetido ── */
                                    <Box
                                        key={idx}
                                        sx={{
                                            borderLeft: `3px solid ${primary[500]}40`,
                                            borderRadius: '0 6px 6px 0',
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            pl: 1.5,
                                            pr: 1,
                                            py: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.75,
                                        }}
                                    >
                                        {/* Cabeçalho do bloco */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RepeatIcon sx={{ fontSize: 15, color: primary[500] }} />
                                            <Box sx={{ fontSize: '0.72rem', color: surface[400] }}>Repetir</Box>
                                            <TextField
                                                type="number"
                                                value={item.repeticoes}
                                                onChange={(e) => handleBlocoRepeticoesChange(idx, e.target.value)}
                                                disabled={isSaving}
                                                size="small"
                                                sx={{ width: 60, ...fieldSx }}
                                                inputProps={{ min: 1, step: 1, 'aria-label': `Repetições do bloco ${idx + 1}` }}
                                            />
                                            <Box sx={{ fontSize: '0.72rem', color: surface[400] }}>vezes</Box>
                                            <Box sx={{ flex: 1 }} />
                                            <IconButton
                                                size="small"
                                                aria-label={`Remover bloco ${idx + 1}`}
                                                onClick={() => handleRemoverItem(idx)}
                                                disabled={isSaving}
                                                sx={{ color: semantic.danger[500], '&:hover': { color: semantic.danger[700] } }}
                                            >
                                                <RemoveIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>

                                        {/* Sub-etapas do bloco */}
                                        {item.steps.map((step, si) => (
                                            <Box key={si} sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 0.5 }}>
                                                <FormControl size="small" sx={{ minWidth: 140, ...nativeSelectSx }}>
                                                    <InputLabel shrink>Tipo</InputLabel>
                                                    <Select
                                                        native
                                                        label="Tipo"
                                                        value={step.tipoEtapa}
                                                        onChange={(e) => handleSubStepChange(idx, si, 'tipoEtapa', e.target.value as string)}
                                                        disabled={isSaving}
                                                        inputProps={{ 'aria-label': `Tipo do passo ${si + 1} do bloco ${idx + 1}` }}
                                                    >
                                                        <option value="" disabled />
                                                        {TIPOS_ETAPA.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <TextField
                                                    label="Min"
                                                    type="number"
                                                    value={step.duracaoMin}
                                                    onChange={(e) => handleSubStepChange(idx, si, 'duracaoMin', e.target.value)}
                                                    disabled={isSaving}
                                                    size="small"
                                                    sx={{ width: 72, ...fieldSx }}
                                                    inputProps={{ min: 1, step: 1, 'aria-label': `Duração do passo ${si + 1} do bloco ${idx + 1}` }}
                                                />
                                                {item.steps.length > 1 && (
                                                    <IconButton
                                                        size="small"
                                                        aria-label={`Remover passo ${si + 1} do bloco ${idx + 1}`}
                                                        onClick={() => handleRemoverSubStep(idx, si)}
                                                        disabled={isSaving}
                                                        sx={{ color: semantic.danger[300], '&:hover': { color: semantic.danger[500] } }}
                                                    >
                                                        <RemoveIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ))}

                                        {/* Adicionar passo ao bloco */}
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<AddIcon sx={{ fontSize: 12 }} />}
                                            onClick={() => handleAdicionarSubStep(idx)}
                                            disabled={isSaving}
                                            aria-label={`Adicionar passo ao bloco ${idx + 1}`}
                                            sx={{
                                                textTransform: 'none',
                                                fontSize: '0.68rem',
                                                color: primary[500],
                                                px: 0,
                                                alignSelf: 'flex-start',
                                                ml: 0.5,
                                            }}
                                        >
                                            Adicionar passo
                                        </Button>
                                    </Box>
                                )
                            )}

                            {/* Botões de adicionar item */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                    onClick={handleAdicionarEtapaSimples}
                                    disabled={isSaving}
                                    aria-label="Adicionar etapa simples"
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        color: primary[500],
                                        px: 0,
                                    }}
                                >
                                    Etapa simples
                                </Button>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<RepeatIcon sx={{ fontSize: 14 }} />}
                                    onClick={handleAdicionarBloco}
                                    disabled={isSaving}
                                    aria-label="Adicionar bloco repetido"
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.72rem',
                                        color: surface[400],
                                        px: 0,
                                        '&:hover': { color: primary[500] },
                                    }}
                                >
                                    Bloco repetido
                                </Button>
                            </Box>
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
