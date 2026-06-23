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
import { primary, surface, semantic, categorical, content } from '../../../theme/tokens';
import { useAddTreinoPlanejado } from '../../../hooks/useAddTreinoPlanejado';
import type { TreinoPlanejadoDto, TreinoPlanejadoAddPayload, EtapaInputPayload } from '../../../types/PlanoReview';

// ── Paleta metabólica por tipo de etapa ─────────────────────────────────────

const ETAPA_PALETTE: Record<string, { bg: string; border: string; label: string }> = {
    AQUECIMENTO:    { bg: `${categorical.cat3}22`, border: categorical.cat3,  label: 'AQUEC'   },
    PRINCIPAL:      { bg: `${categorical.cat1}22`, border: categorical.cat1,  label: 'PRINC'   },
    INTERVALADO:    { bg: `${semantic.danger[500]}22`, border: semantic.danger[500], label: 'INTERV' },
    RECUPERACAO:    { bg: `${categorical.cat6}22`, border: categorical.cat6,  label: 'RECUP'   },
    DESAQUECIMENTO: { bg: `${surface[500]}22`, border: surface[500],          label: 'DESAQ'   },
};

// ── Constantes ───────────────────────────────────────────────────────────────

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
] as const;

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Tipos internos ───────────────────────────────────────────────────────────

interface StepRow  { kind: 'step';  tipoEtapa: string; duracaoMin: string }
interface SubStep  { tipoEtapa: string; duracaoMin: string }
interface BlockRow { kind: 'block'; repeticoes: string; steps: SubStep[] }
type EtapaItem = StepRow | BlockRow;

// ── Helpers ──────────────────────────────────────────────────────────────────

function gerarDatas(semanaInicio: string, semanaFim: string): string[] {
    const datas: string[] = [];
    const inicio = new Date(`${semanaInicio}T00:00:00`);
    const fim    = new Date(`${semanaFim}T00:00:00`);
    for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1))
        datas.push(d.toISOString().slice(0, 10));
    return datas;
}

function formatarDataLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return `${DIAS_PT[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function serializarItens(itens: EtapaItem[]): EtapaInputPayload[] {
    return itens.map((item): EtapaInputPayload | null => {
        if (item.kind === 'block') {
            const subEtapas = item.steps.filter(s => s.tipoEtapa)
                .map(s => ({ tipoEtapa: s.tipoEtapa, duracaoMin: s.duracaoMin ? parseInt(s.duracaoMin, 10) : undefined }));
            if (!subEtapas.length) return null;
            return { tipoEtapa: 'BLOCO', blocoRepeticoes: parseInt(item.repeticoes, 10) || 1, subEtapas };
        }
        if (!item.tipoEtapa) return null;
        return { tipoEtapa: item.tipoEtapa, duracaoMin: item.duracaoMin ? parseInt(item.duracaoMin, 10) : undefined };
    }).filter((e): e is EtapaInputPayload => e !== null);
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface TreinoAddDialogProps {
    open: boolean;
    planoId: string;
    semanaInicio: string;
    semanaFim: string;
    treinosExistentes: TreinoPlanejadoDto[];
    onClose: () => void;
    onSaved: (treino: TreinoPlanejadoDto) => void;
}

// ── Sub-componente: chip de tipo com cor metabólica ──────────────────────────

function EtapaTypeBadge({ tipo }: { tipo: string }) {
    const p = ETAPA_PALETTE[tipo];
    if (!p) return null;
    return (
        <Box sx={{
            fontSize: '0.58rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: p.border,
            bgcolor: p.bg,
            border: `1px solid ${p.border}40`,
            borderRadius: '3px',
            px: 0.6,
            py: 0.2,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            userSelect: 'none',
        }}>
            {p.label}
        </Box>
    );
}

// ── Estilo base para selects nativos ─────────────────────────────────────────

const SELECT_SX = {
    '& .MuiOutlinedInput-root': {
        fontSize: '0.8rem',
        color: surface[100],
        bgcolor: `${surface[0]}06`,
        borderRadius: '6px',
        '& fieldset': { borderColor: `${surface[0]}14` },
        '&:hover fieldset': { borderColor: `${surface[0]}33` },
        '&.Mui-focused fieldset': { borderColor: `${primary[500]}99` },
    },
    '& .MuiInputLabel-root': { fontSize: '0.68rem', color: surface[500], letterSpacing: '0.04em' },
    '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
    '& select': { fontSize: '0.8rem', color: surface[100], bgcolor: 'transparent' },
} as const;

const FIELD_SX = {
    '& .MuiOutlinedInput-root': {
        fontSize: '0.8rem',
        color: surface[100],
        bgcolor: `${surface[0]}06`,
        borderRadius: '6px',
        '& fieldset': { borderColor: `${surface[0]}14` },
        '&:hover fieldset': { borderColor: `${surface[0]}33` },
        '&.Mui-focused fieldset': { borderColor: `${primary[500]}99` },
    },
    '& .MuiInputLabel-root': { fontSize: '0.68rem', color: surface[500], letterSpacing: '0.04em' },
    '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
    },
} as const;

// estilo dedicado para o campo de repetições — cockpit/monospace
const REPS_SX = {
    ...FIELD_SX,
    '& .MuiOutlinedInput-root': {
        ...FIELD_SX['& .MuiOutlinedInput-root'],
        fontSize: '1rem',
        fontFamily: '"Courier New", Courier, monospace',
        fontWeight: 700,
        color: primary[400],
        letterSpacing: '0.04em',
        '& fieldset': { borderColor: `${primary[500]}40` },
        '&:hover fieldset': { borderColor: `${primary[500]}80` },
        '&.Mui-focused fieldset': { borderColor: primary[500] },
    },
} as const;

// ── Dialog principal ─────────────────────────────────────────────────────────

export function TreinoAddDialog({
    open, planoId, semanaInicio, semanaFim, treinosExistentes, onClose, onSaved,
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
    const treinosNaData = dataTreino ? treinosExistentes.filter(t => t.dataTreino === dataTreino) : [];
    const canSave = tipoTreino.trim() !== '' && dataTreino !== '';

    // ── Handlers ─────────────────────────────────────────────────────────────

    const addStep  = () => setItens(p => [...p, { kind: 'step', tipoEtapa: '', duracaoMin: '' }]);
    const addBlock = () => setItens(p => [...p, { kind: 'block', repeticoes: '2', steps: [{ tipoEtapa: '', duracaoMin: '' }] }]);
    const removeItem = (i: number) => setItens(p => p.filter((_,x) => x !== i));

    const updateStep = (i: number, f: 'tipoEtapa'|'duracaoMin', v: string) =>
        setItens(p => p.map((item, x) => x !== i || item.kind !== 'step' ? item : { ...item, [f]: v }));

    const updateBlocoReps = (i: number, v: string) =>
        setItens(p => p.map((item, x) => x !== i || item.kind !== 'block' ? item : { ...item, repeticoes: v }));

    const addSubStep = (bi: number) =>
        setItens(p => p.map((item, x) => x !== bi || item.kind !== 'block' ? item
            : { ...item, steps: [...item.steps, { tipoEtapa: '', duracaoMin: '' }] }));

    const removeSubStep = (bi: number, si: number) =>
        setItens(p => p.map((item, x) => x !== bi || item.kind !== 'block' ? item
            : { ...item, steps: item.steps.filter((_,y) => y !== si) }));

    const updateSubStep = (bi: number, si: number, f: 'tipoEtapa'|'duracaoMin', v: string) =>
        setItens(p => p.map((item, x) => x !== bi || item.kind !== 'block' ? item
            : { ...item, steps: item.steps.map((s,y) => y !== si ? s : { ...s, [f]: v }) }));

    const handleClose = () => { if (!isSaving) { resetForm(); onClose(); } };

    const resetForm = () => {
        setTipoTreino(''); setDataTreino(''); setDistanciaKm(''); setDuracaoMin('');
        setZonaAlvo(''); setRpe(''); setTss(''); setObservacoes('');
        setEtapasExpanded(false); setItens([]); setApiError(null);
    };

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
            if (etapas.length) payload.etapas = etapas;
        }
        try {
            const novo = await adicionarTreino(planoId, payload);
            resetForm(); onSaved(novo);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Erro ao adicionar treino');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: surface[900],
                    border: `1px solid ${surface[0]}1A`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: `0 0 0 1px ${surface[0]}08, 0 32px 80px rgba(0,0,0,0.6)`,
                },
            }}
        >
            {/* ─── Header ──────────────────────────────────────────────────── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    px: 2.5, pt: 2, pb: 1.5,
                    borderBottom: `1px solid ${surface[0]}12`,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    {/* ícone geométrico */}
                    <Box sx={{
                        width: 28, height: 28,
                        bgcolor: `${primary[500]}18`,
                        border: `1px solid ${primary[500]}40`,
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Box component="svg" viewBox="0 0 16 16" sx={{ width: 14, height: 14, color: primary[500] }}>
                            <path fill="currentColor" d="M2 3h4v10H2V3zm5 0h2v10H7V3zm3 0h4v10h-4V3z" opacity=".35"/>
                            <path fill="currentColor" d="M2 3h4v4H2V3zm5 3h2v4H7V6zm3 2h4v5h-4V8z"/>
                        </Box>
                    </Box>
                    <Box>
                        <Box sx={{
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '0.62rem',
                            letterSpacing: '0.14em',
                            color: primary[500],
                            textTransform: 'uppercase',
                            lineHeight: 1,
                            mb: 0.25,
                        }}>
                            COACH · SESSÃO
                        </Box>
                        <Box sx={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: surface[50],
                            lineHeight: 1.2,
                            letterSpacing: '-0.01em',
                        }}>
                            Adicionar treino
                        </Box>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {/* ─── Linha obrigatória ────────────────────────────────── */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <FormControl fullWidth size="small" sx={SELECT_SX}>
                        <InputLabel htmlFor="tipo-treino-input" shrink>Tipo de treino</InputLabel>
                        <Select
                            native label="Tipo de treino" value={tipoTreino}
                            onChange={e => setTipoTreino(e.target.value as string)}
                            disabled={isSaving}
                            inputProps={{ id: 'tipo-treino-input', 'aria-label': 'Tipo de treino' }}
                        >
                            <option value="" disabled />
                            {TIPOS_TREINO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" sx={SELECT_SX}>
                        <InputLabel htmlFor="data-treino-input" shrink>Data do treino</InputLabel>
                        <Select
                            native label="Data do treino" value={dataTreino}
                            onChange={e => setDataTreino(e.target.value as string)}
                            disabled={isSaving}
                            inputProps={{ id: 'data-treino-input', 'aria-label': 'Data do treino' }}
                        >
                            <option value="" disabled />
                            {datas.map(d => <option key={d} value={d}>{formatarDataLabel(d)}</option>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* ─── Aviso double-day ────────────────────────────────── */}
                {treinosNaData.length > 0 && (
                    <Alert severity="warning" variant="outlined" sx={{
                        fontSize: '0.73rem', py: 0.5,
                        borderColor: `${semantic.warning[500]}40`,
                        bgcolor: `${semantic.warning[500]}08`,
                        color: semantic.warning[400],
                        '& .MuiAlert-icon': { color: semantic.warning[400], fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.73rem' },
                    }}>
                        {treinosNaData.length} treino(s) já nesta data — double-day permitido, confirme.
                    </Alert>
                )}

                {/* ─── Campos opcionais ─────────────────────────────────── */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField label="Distância (km)" type="number" value={distanciaKm}
                        onChange={e => setDistanciaKm(e.target.value)} disabled={isSaving}
                        size="small" fullWidth inputProps={{ min: 0, step: 0.1 }} sx={FIELD_SX} />
                    <TextField label="Duração (min)" type="number" value={duracaoMin}
                        onChange={e => setDuracaoMin(e.target.value)} disabled={isSaving}
                        size="small" fullWidth inputProps={{ min: 1, step: 1 }} sx={FIELD_SX} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField label="Zona alvo" value={zonaAlvo}
                        onChange={e => setZonaAlvo(e.target.value)} disabled={isSaving}
                        size="small" fullWidth sx={FIELD_SX} />
                    <TextField label="RPE (1–10)" type="number" value={rpe}
                        onChange={e => setRpe(e.target.value)} disabled={isSaving}
                        size="small" fullWidth inputProps={{ min: 1, max: 10, step: 1 }} sx={FIELD_SX} />
                    <TextField label="TSS" type="number" value={tss}
                        onChange={e => setTss(e.target.value)} disabled={isSaving}
                        size="small" fullWidth inputProps={{ min: 1, step: 1 }} sx={FIELD_SX} />
                </Box>

                <TextField label="Observações" value={observacoes}
                    onChange={e => setObservacoes(e.target.value)} disabled={isSaving}
                    multiline rows={2} fullWidth inputProps={{ maxLength: 500 }} sx={FIELD_SX} />

                {/* ─── Divisor ─────────────────────────────────────────── */}
                <Box sx={{ height: '1px', bgcolor: `${surface[0]}0E` }} />

                {/* ─── Seção etapas ─────────────────────────────────────── */}
                <Box>
                    <Button
                        size="small" variant="text" disabled={isSaving}
                        onClick={() => setEtapasExpanded(p => !p)}
                        aria-label={etapasExpanded ? 'Ocultar etapas' : 'Adicionar etapas'}
                        sx={{
                            textTransform: 'none', px: 0,
                            fontSize: '0.72rem',
                            fontFamily: '"Courier New", Courier, monospace',
                            letterSpacing: '0.06em',
                            color: etapasExpanded ? primary[400] : surface[500],
                            '&:hover': { color: primary[500], bgcolor: 'transparent' },
                        }}
                    >
                        {etapasExpanded ? '▾ SESSÃO ESTRUTURADA' : '▸ SESSÃO ESTRUTURADA'}
                        {itens.length > 0 && (
                            <Box component="span" sx={{
                                ml: 1, fontSize: '0.58rem', fontWeight: 700,
                                bgcolor: `${primary[500]}22`, color: primary[400],
                                border: `1px solid ${primary[500]}40`,
                                borderRadius: '3px', px: 0.6, py: 0.1,
                            }}>
                                {itens.length}
                            </Box>
                        )}
                    </Button>

                    {etapasExpanded && (
                        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>

                            {itens.map((item, idx) => item.kind === 'step' ? (

                                /* ── Etapa avulsa ─────────────────────────────── */
                                <Box key={idx} sx={{
                                    display: 'flex', gap: 1, alignItems: 'center',
                                    pl: 0.5, pr: 0.5,
                                    bgcolor: item.tipoEtapa
                                        ? ETAPA_PALETTE[item.tipoEtapa]?.bg ?? `${surface[0]}06`
                                        : `${surface[0]}06`,
                                    border: `1px solid ${item.tipoEtapa
                                        ? (ETAPA_PALETTE[item.tipoEtapa]?.border ?? surface[500]) + '28'
                                        : surface[0] + '0E'}`,
                                    borderRadius: '6px', py: 0.75,
                                    transition: 'all 0.2s',
                                }}>
                                    {item.tipoEtapa && <EtapaTypeBadge tipo={item.tipoEtapa} />}
                                    <FormControl size="small" sx={{ minWidth: 145, ...SELECT_SX }}>
                                        <InputLabel shrink>Tipo</InputLabel>
                                        <Select
                                            native label="Tipo" value={item.tipoEtapa}
                                            onChange={e => updateStep(idx, 'tipoEtapa', e.target.value as string)}
                                            disabled={isSaving}
                                            inputProps={{ 'aria-label': `Tipo da etapa ${idx + 1}` }}
                                        >
                                            <option value="" disabled />
                                            {TIPOS_ETAPA.map(t => <option key={t} value={t}>{t}</option>)}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Min" type="number" value={item.duracaoMin}
                                        onChange={e => updateStep(idx, 'duracaoMin', e.target.value)}
                                        disabled={isSaving} size="small"
                                        sx={{ width: 68, ...FIELD_SX }}
                                        inputProps={{ min: 1, step: 1, 'aria-label': `Duração da etapa ${idx + 1}` }}
                                    />
                                    <IconButton size="small" onClick={() => removeItem(idx)}
                                        disabled={isSaving}
                                        aria-label={`Remover etapa ${idx + 1}`}
                                        sx={{ color: `${semantic.danger[500]}80`, ml: 'auto',
                                            '&:hover': { color: semantic.danger[500], bgcolor: `${semantic.danger[500]}12` } }}>
                                        <RemoveIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Box>

                            ) : (

                                /* ── Bloco repetido ───────────────────────────── */
                                <Box key={idx} sx={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    border: `1px solid ${primary[500]}28`,
                                    bgcolor: `${primary[500]}06`,
                                    overflow: 'hidden',
                                    /* faixa vertical decorativa */
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0, top: 0, bottom: 0,
                                        width: '3px',
                                        bgcolor: primary[500],
                                        opacity: 0.7,
                                    },
                                }}>
                                    {/* Cabeçalho do bloco */}
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        pl: 2, pr: 1, pt: 1, pb: 0.75,
                                        borderBottom: `1px solid ${primary[500]}18`,
                                    }}>
                                        <RepeatIcon sx={{ fontSize: 13, color: primary[400], flexShrink: 0 }} />
                                        <Box sx={{
                                            fontSize: '0.62rem', fontFamily: '"Courier New", Courier, monospace',
                                            letterSpacing: '0.1em', color: primary[400], textTransform: 'uppercase',
                                        }}>
                                            Repetir
                                        </Box>
                                        <TextField
                                            type="number" value={item.repeticoes}
                                            onChange={e => updateBlocoReps(idx, e.target.value)}
                                            disabled={isSaving} size="small"
                                            sx={{ width: 56, ...REPS_SX }}
                                            inputProps={{ min: 1, step: 1, 'aria-label': `Repetições do bloco ${idx + 1}` }}
                                        />
                                        <Box sx={{
                                            fontSize: '0.62rem', fontFamily: '"Courier New", Courier, monospace',
                                            letterSpacing: '0.1em', color: primary[400], textTransform: 'uppercase',
                                        }}>
                                            ×
                                        </Box>
                                        <Box sx={{ flex: 1 }} />
                                        <IconButton size="small" onClick={() => removeItem(idx)}
                                            disabled={isSaving}
                                            aria-label={`Remover bloco ${idx + 1}`}
                                            sx={{ color: `${semantic.danger[500]}70`,
                                                '&:hover': { color: semantic.danger[500], bgcolor: `${semantic.danger[500]}12` } }}>
                                            <RemoveIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Box>

                                    {/* Sub-etapas */}
                                    <Box sx={{ pl: 2, pr: 1, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                        {item.steps.map((step, si) => (
                                            <Box key={si} sx={{
                                                display: 'flex', gap: 1, alignItems: 'center',
                                                bgcolor: step.tipoEtapa
                                                    ? ETAPA_PALETTE[step.tipoEtapa]?.bg ?? `${surface[0]}06`
                                                    : `${surface[0]}04`,
                                                border: `1px solid ${step.tipoEtapa
                                                    ? (ETAPA_PALETTE[step.tipoEtapa]?.border ?? surface[500]) + '22'
                                                    : surface[0] + '0A'}`,
                                                borderRadius: '5px', px: 0.75, py: 0.5,
                                                transition: 'all 0.18s',
                                            }}>
                                                {step.tipoEtapa && <EtapaTypeBadge tipo={step.tipoEtapa} />}
                                                <FormControl size="small" sx={{ minWidth: 138, ...SELECT_SX }}>
                                                    <InputLabel shrink>Tipo</InputLabel>
                                                    <Select
                                                        native label="Tipo" value={step.tipoEtapa}
                                                        onChange={e => updateSubStep(idx, si, 'tipoEtapa', e.target.value as string)}
                                                        disabled={isSaving}
                                                        inputProps={{ 'aria-label': `Tipo do passo ${si + 1} do bloco ${idx + 1}` }}
                                                    >
                                                        <option value="" disabled />
                                                        {TIPOS_ETAPA.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </Select>
                                                </FormControl>
                                                <TextField
                                                    label="Min" type="number" value={step.duracaoMin}
                                                    onChange={e => updateSubStep(idx, si, 'duracaoMin', e.target.value)}
                                                    disabled={isSaving} size="small"
                                                    sx={{ width: 62, ...FIELD_SX }}
                                                    inputProps={{ min: 1, step: 1, 'aria-label': `Duração do passo ${si + 1} do bloco ${idx + 1}` }}
                                                />
                                                {item.steps.length > 1 && (
                                                    <IconButton size="small"
                                                        onClick={() => removeSubStep(idx, si)}
                                                        disabled={isSaving}
                                                        aria-label={`Remover passo ${si + 1} do bloco ${idx + 1}`}
                                                        sx={{ color: `${semantic.danger[500]}55`,
                                                            '&:hover': { color: semantic.danger[500], bgcolor: `${semantic.danger[500]}0F` } }}>
                                                        <RemoveIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ))}

                                        <Button size="small" variant="text"
                                            startIcon={<AddIcon sx={{ fontSize: 11 }} />}
                                            onClick={() => addSubStep(idx)}
                                            disabled={isSaving}
                                            aria-label={`Adicionar passo ao bloco ${idx + 1}`}
                                            sx={{
                                                textTransform: 'none', px: 0,
                                                fontSize: '0.66rem',
                                                letterSpacing: '0.03em',
                                                color: `${primary[500]}80`,
                                                alignSelf: 'flex-start',
                                                '&:hover': { color: primary[400], bgcolor: 'transparent' },
                                            }}>
                                            passo
                                        </Button>
                                    </Box>
                                </Box>
                            ))}

                            {/* ── Botões de adicionar ───────────────────── */}
                            <Box sx={{ display: 'flex', gap: 1.5, pt: 0.25 }}>
                                <Button size="small" variant="text"
                                    startIcon={<AddIcon sx={{ fontSize: 13, color: content.cardBorder }} />}
                                    onClick={addStep} disabled={isSaving}
                                    aria-label="Adicionar etapa simples"
                                    sx={{
                                        textTransform: 'none', px: 1, py: 0.5,
                                        fontSize: '0.7rem', letterSpacing: '0.03em',
                                        color: surface[400],
                                        border: `1px dashed ${surface[0]}18`,
                                        borderRadius: '5px',
                                        '&:hover': { color: surface[100], borderColor: `${surface[0]}33`, bgcolor: `${surface[0]}08` },
                                    }}>
                                    Etapa simples
                                </Button>
                                <Button size="small" variant="text"
                                    startIcon={<RepeatIcon sx={{ fontSize: 13, color: `${primary[500]}80` }} />}
                                    onClick={addBlock} disabled={isSaving}
                                    aria-label="Adicionar bloco repetido"
                                    sx={{
                                        textTransform: 'none', px: 1, py: 0.5,
                                        fontSize: '0.7rem', letterSpacing: '0.03em',
                                        color: `${primary[400]}CC`,
                                        border: `1px dashed ${primary[500]}30`,
                                        borderRadius: '5px',
                                        '&:hover': { color: primary[400], borderColor: `${primary[500]}60`, bgcolor: `${primary[500]}08` },
                                    }}>
                                    Bloco repetido
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* ─── Erro da API ─────────────────────────────────────── */}
                {apiError && (
                    <Alert severity="error" sx={{
                        fontSize: '0.73rem', py: 0.5,
                        bgcolor: `${semantic.danger[500]}10`,
                        borderColor: `${semantic.danger[500]}40`,
                        color: semantic.danger[300],
                        '& .MuiAlert-icon': { color: semantic.danger[300], fontSize: '1rem' },
                    }}>
                        {apiError}
                    </Alert>
                )}
            </DialogContent>

            {/* ─── Actions ─────────────────────────────────────────────── */}
            <DialogActions sx={{
                px: 2.5, pb: 2, pt: 1, gap: 1,
                borderTop: `1px solid ${surface[0]}0E`,
            }}>
                <Button variant="text" onClick={handleClose} disabled={isSaving}
                    sx={{ color: surface[500], textTransform: 'none', fontSize: '0.78rem',
                        '&:hover': { color: surface[300], bgcolor: 'transparent' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={handleSalvar}
                    disabled={!canSave || isSaving}
                    aria-label="Salvar treino"
                    sx={{
                        bgcolor: canSave ? primary[500] : surface[700],
                        color: canSave ? surface[900] : surface[500],
                        fontWeight: 800, fontSize: '0.8rem',
                        textTransform: 'none', px: 2.5,
                        letterSpacing: '-0.01em',
                        fontFamily: '"Courier New", Courier, monospace',
                        boxShadow: canSave ? `0 0 16px ${primary[500]}40` : 'none',
                        '&:hover': { bgcolor: primary[400], boxShadow: `0 0 22px ${primary[500]}60` },
                        '&.Mui-disabled': { bgcolor: surface[800], color: surface[600] },
                        transition: 'all 0.2s',
                    }}>
                    {isSaving
                        ? <CircularProgress size={14} sx={{ color: surface[900] }} />
                        : 'SALVAR'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
