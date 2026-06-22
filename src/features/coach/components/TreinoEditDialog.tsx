import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDuracaoMinutos(iso?: string): string {
    if (!iso) return '';
    const isoMatch = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (isoMatch) {
        const h = parseInt(isoMatch[1] ?? '0', 10);
        const m = parseInt(isoMatch[2] ?? '0', 10);
        const total = h * 60 + m;
        return total > 0 ? String(total) : '';
    }
    // Legado HH:MM:SS ou MM:SS
    const hmsMatch = iso.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (hmsMatch) {
        const h = parseInt(hmsMatch[1] ?? '0', 10);
        const m = parseInt(hmsMatch[2], 10);
        return String(h * 60 + m);
    }
    return '';
}

function toIso8601(minutos: string): string | undefined {
    const n = parseInt(minutos, 10);
    return isNaN(n) || n <= 0 ? undefined : `PT${n}M`;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_TREINO = [
    { value: 'FACIL',            label: 'Fácil' },
    { value: 'LONGO',            label: 'Longo' },
    { value: 'TEMPO',            label: 'Tempo' },
    { value: 'INTERVALADO',      label: 'Intervalado' },
    { value: 'RECUPERACAO',      label: 'Recuperação' },
    { value: 'FARTLEK',          label: 'Fartlek' },
    { value: 'CORRIDA_CONTINUA', label: 'Corrida Contínua' },
    { value: 'CONTINUO',         label: 'Contínuo' },
];

const TIPOS_INTERVALADOS = new Set(['INTERVALADO', 'FARTLEK']);

const ACCENT = {
    aquecimento:    '#F59E0B',
    esforco:        '#EF4444',
    recuperacao:    '#10B981',
    desaquecimento: '#60A5FA',
    principal:      '#D4FF3A',
} as const;

// ── Estado de bloco ───────────────────────────────────────────────────────────

interface BlocoState {
    distanciaKm: string;
    duracaoMin: string;
    zonaAlvo: string;
    rpe: string;
}

const BLOCO_VAZIO: BlocoState = { distanciaKm: '', duracaoMin: '', zonaAlvo: '', rpe: '' };

function blocoFromTreino(t: TreinoPlanejadoDto): BlocoState {
    return {
        distanciaKm: t.distanciaKm != null ? String(t.distanciaKm) : '',
        duracaoMin:  parseDuracaoMinutos(t.duracaoMin),
        zonaAlvo:    t.zonaAlvo ?? '',
        rpe:         t.percepcaoEsforcoEsperada != null ? String(t.percepcaoEsforcoEsperada) : '',
    };
}

// ── BlocoCard ─────────────────────────────────────────────────────────────────

function fieldSx(accent: string) {
    return {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.82rem',
            color: surface[100],
            bgcolor: 'rgba(255,255,255,0.04)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
            '&.Mui-focused fieldset': { borderColor: accent },
        },
        '& .MuiInputLabel-root': { fontSize: '0.72rem', color: surface[500] },
        '& .MuiInputLabel-root.Mui-focused': { color: accent },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;
}

interface BlocoCardProps {
    label: string;
    accent: string;
    bloco: BlocoState;
    onChange: (b: BlocoState) => void;
    disabled?: boolean;
    actions?: React.ReactNode;
}

function BlocoCard({ label, accent, bloco, onChange, disabled, actions }: BlocoCardProps) {
    return (
        <Box
            sx={{
                borderLeft: `3px solid ${accent}`,
                borderRadius: '0 8px 8px 0',
                bgcolor: 'rgba(255,255,255,0.025)',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        px: 0.75,
                        py: 0.2,
                        borderRadius: '4px',
                        bgcolor: `${accent}18`,
                        border: `1px solid ${accent}33`,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: accent,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        userSelect: 'none',
                    }}
                >
                    {label}
                </Box>
                {actions && <Box sx={{ ml: 'auto' }}>{actions}</Box>}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="Distância (km)"
                    type="number"
                    value={bloco.distanciaKm}
                    onChange={e => onChange({ ...bloco, distanciaKm: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={fieldSx(accent)}
                />
                <TextField
                    label="Duração (min)"
                    type="number"
                    value={bloco.duracaoMin}
                    onChange={e => onChange({ ...bloco, duracaoMin: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, step: 1 }}
                    sx={fieldSx(accent)}
                />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="Zona alvo"
                    value={bloco.zonaAlvo}
                    onChange={e => onChange({ ...bloco, zonaAlvo: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    sx={fieldSx(accent)}
                />
                <TextField
                    label="RPE (1–10)"
                    type="number"
                    value={bloco.rpe}
                    onChange={e => onChange({ ...bloco, rpe: e.target.value })}
                    disabled={disabled}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: 10, step: 1 }}
                    sx={fieldSx(accent)}
                />
            </Box>
        </Box>
    );
}

// ── AddBlocoBtn ───────────────────────────────────────────────────────────────

function AddBlocoBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    return (
        <Button
            size="small"
            variant="text"
            startIcon={<AddIcon sx={{ fontSize: '13px !important' }} />}
            onClick={onClick}
            sx={{
                alignSelf: 'flex-start',
                fontSize: '0.7rem',
                color,
                textTransform: 'none',
                px: 1,
                py: 0.3,
                borderRadius: '6px',
                '&:hover': { bgcolor: `${color}12` },
            }}
        >
            {label}
        </Button>
    );
}

// ── TreinoEditDialog ──────────────────────────────────────────────────────────

export interface TreinoEditDialogProps {
    open: boolean;
    treino: TreinoPlanejadoDto;
    isSaving: boolean;
    onClose: () => void;
    onSave: (patch: TreinoPlanejadoPatch) => void;
}

export function TreinoEditDialog({ open, treino, isSaving, onClose, onSave }: TreinoEditDialogProps) {
    const [tipoTreino, setTipoTreino]         = useState(treino.tipoTreino ?? '');
    const [tss, setTss]                       = useState(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
    const [observacao, setObservacao]         = useState(treino.observacao ?? '');

    // Bloco principal (simples) / bloco de esforço (intervalado)
    const [principal, setPrincipal]           = useState<BlocoState>(blocoFromTreino(treino));
    // Bloco de recuperação — apenas modo intervalado
    const [recuperacao, setRecuperacao]       = useState<BlocoState>(BLOCO_VAZIO);
    // Repetições da série
    const [repeticoes, setRepeticoes]         = useState(1);
    // Blocos opcionais
    const [aquecimento, setAquecimento]       = useState<BlocoState | null>(null);
    const [desaquecimento, setDesaquecimento] = useState<BlocoState | null>(null);

    const isIntervalado = TIPOS_INTERVALADOS.has(tipoTreino);

    useEffect(() => {
        setTipoTreino(treino.tipoTreino ?? '');
        setTss(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
        setObservacao(treino.observacao ?? '');
        setPrincipal(blocoFromTreino(treino));
        setRecuperacao(BLOCO_VAZIO);
        setRepeticoes(1);
        setAquecimento(null);
        setDesaquecimento(null);
    }, [treino]);

    // Totais calculados em tempo real a partir dos blocos
    const { totalKm, totalMin } = useMemo(() => {
        let km = 0;
        let min = 0;

        const soma = (b: BlocoState | null) => {
            if (!b) return;
            km  += parseFloat(b.distanciaKm) || 0;
            min += parseInt(b.duracaoMin, 10) || 0;
        };

        if (isIntervalado) {
            soma(aquecimento);
            const rep = Math.max(1, repeticoes);
            km  += ((parseFloat(principal.distanciaKm) || 0) + (parseFloat(recuperacao.distanciaKm) || 0)) * rep;
            min += ((parseInt(principal.duracaoMin, 10) || 0) + (parseInt(recuperacao.duracaoMin, 10) || 0)) * rep;
            soma(desaquecimento);
        } else {
            soma(principal);
        }

        return {
            totalKm:  km  > 0 ? km.toFixed(1)  : null,
            totalMin: min > 0 ? String(min)     : null,
        };
    }, [isIntervalado, principal, recuperacao, repeticoes, aquecimento, desaquecimento]);

    const handleSalvar = () => {
        const patch: TreinoPlanejadoPatch = {};

        if (tipoTreino && tipoTreino !== treino.tipoTreino) patch.tipoTreino = tipoTreino;

        const distNum = isIntervalado
            ? (totalKm ? parseFloat(totalKm) : NaN)
            : (parseFloat(principal.distanciaKm) || NaN);

        const durMin = isIntervalado
            ? (totalMin ? parseInt(totalMin, 10) : NaN)
            : (parseInt(principal.duracaoMin, 10) || NaN);

        if (!isNaN(distNum) && distNum !== treino.distanciaKm) patch.distanciaKm = distNum;

        const duracaoIso = toIso8601(String(durMin));
        if (duracaoIso && duracaoIso !== treino.duracaoMin) patch.duracaoMin = duracaoIso;

        if (principal.zonaAlvo && principal.zonaAlvo !== treino.zonaAlvo) patch.zonaAlvo = principal.zonaAlvo;

        const rpeNum = parseInt(principal.rpe, 10);
        if (!isNaN(rpeNum) && rpeNum !== treino.percepcaoEsforcoEsperada) patch.percepcaoEsforcoEsperada = rpeNum;

        const tssNum = parseInt(tss, 10);
        if (!isNaN(tssNum) && tssNum !== treino.tssPlanejado) patch.tssPlanejado = tssNum;

        if (observacao !== treino.observacao) patch.observacao = observacao || undefined;

        if (Object.keys(patch).length === 0) {
            onClose();
            return;
        }

        onSave(patch);
    };

    const diaSemana = typeof treino.diaSemana === 'string'
        ? treino.diaSemana
        : (treino.diaSemana as { value: string }).value;

    const footerFieldSx = {
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
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: elevation.highest,
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                },
            }}
        >
            {/* ── Cabeçalho ── */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.75,
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '4px',
                        bgcolor: 'rgba(255,255,255,0.07)',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: surface[400],
                        fontFamily: 'monospace',
                        letterSpacing: '0.07em',
                        userSelect: 'none',
                    }}
                >
                    {diaSemana.slice(0, 3).toUpperCase()}
                </Box>

                <Select
                    value={tipoTreino}
                    onChange={e => setTipoTreino(e.target.value)}
                    size="small"
                    disabled={isSaving}
                    variant="standard"
                    disableUnderline
                    sx={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: surface[50],
                        '& .MuiSvgIcon-root': { color: surface[500], fontSize: '1.1rem' },
                        '&.MuiInputBase-root': { bgcolor: 'transparent' },
                    }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: elevation.highest, borderRadius: '10px', mt: 0.5 } } }}
                >
                    {TIPOS_TREINO.map(t => (
                        <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.85rem' }}>
                            {t.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* ── Conteúdo ── */}
            <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {isIntervalado ? (
                    /* ── Modo intervalado / Fartlek ── */
                    <>
                        {aquecimento === null ? (
                            <AddBlocoBtn
                                label="+ Aquecimento"
                                color={ACCENT.aquecimento}
                                onClick={() => setAquecimento(BLOCO_VAZIO)}
                            />
                        ) : (
                            <BlocoCard
                                label="Aquecimento"
                                accent={ACCENT.aquecimento}
                                bloco={aquecimento}
                                onChange={setAquecimento}
                                disabled={isSaving}
                                actions={
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => setAquecimento(null)}
                                        sx={{ fontSize: '0.62rem', color: surface[600], textTransform: 'none', px: 0.5, minWidth: 0 }}
                                    >
                                        remover
                                    </Button>
                                }
                            />
                        )}

                        {/* Container da série */}
                        <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                            {/* Cabeçalho com stepper de repetições */}
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.85,
                                    bgcolor: 'rgba(255,255,255,0.035)',
                                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        color: surface[500],
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    Série
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setRepeticoes(r => Math.max(1, r - 1))}
                                        disabled={isSaving || repeticoes <= 1}
                                        aria-label="Diminuir repetições"
                                        sx={{ p: 0.3, color: surface[500], '&:hover': { color: surface[100] } }}
                                    >
                                        <RemoveIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                    <Box
                                        sx={{
                                            minWidth: 44,
                                            textAlign: 'center',
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            color: primary[500],
                                            fontFamily: 'monospace',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        {repeticoes}×
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => setRepeticoes(r => Math.min(20, r + 1))}
                                        disabled={isSaving || repeticoes >= 20}
                                        aria-label="Aumentar repetições"
                                        sx={{ p: 0.3, color: surface[500], '&:hover': { color: surface[100] } }}
                                    >
                                        <AddIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                <BlocoCard
                                    label="Esforço"
                                    accent={ACCENT.esforco}
                                    bloco={principal}
                                    onChange={setPrincipal}
                                    disabled={isSaving}
                                />
                                <BlocoCard
                                    label="Recuperação"
                                    accent={ACCENT.recuperacao}
                                    bloco={recuperacao}
                                    onChange={setRecuperacao}
                                    disabled={isSaving}
                                />
                            </Box>
                        </Box>

                        {desaquecimento === null ? (
                            <AddBlocoBtn
                                label="+ Desaquecimento"
                                color={ACCENT.desaquecimento}
                                onClick={() => setDesaquecimento(BLOCO_VAZIO)}
                            />
                        ) : (
                            <BlocoCard
                                label="Desaquecimento"
                                accent={ACCENT.desaquecimento}
                                bloco={desaquecimento}
                                onChange={setDesaquecimento}
                                disabled={isSaving}
                                actions={
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => setDesaquecimento(null)}
                                        sx={{ fontSize: '0.62rem', color: surface[600], textTransform: 'none', px: 0.5, minWidth: 0 }}
                                    >
                                        remover
                                    </Button>
                                }
                            />
                        )}
                    </>
                ) : (
                    /* ── Modo simples ── */
                    <BlocoCard
                        label="Treino"
                        accent={ACCENT.principal}
                        bloco={principal}
                        onChange={setPrincipal}
                        disabled={isSaving}
                    />
                )}

                {/* ── Campos globais ── */}
                <Box
                    sx={{
                        pt: 1.5,
                        mt: 0.5,
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.25,
                    }}
                >
                    <TextField
                        label="TSS planejado (opcional)"
                        placeholder="Calculado automaticamente"
                        type="number"
                        value={tss}
                        onChange={e => setTss(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, max: 500, step: 1 }}
                        sx={footerFieldSx}
                    />
                    <TextField
                        label="Observação"
                        value={observacao}
                        onChange={e => setObservacao(e.target.value)}
                        disabled={isSaving}
                        multiline
                        rows={2}
                        fullWidth
                        inputProps={{ maxLength: 500 }}
                        sx={footerFieldSx}
                    />
                </Box>
            </DialogContent>

            {/* ── Rodapé ── */}
            <DialogActions sx={{ px: 2.5, pb: 2, pt: 0, flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
                {/* Sumário live de totais */}
                {(totalKm || totalMin) && (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.7,
                            borderRadius: '6px',
                            bgcolor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            gap: 2.5,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                color: surface[500],
                                fontFamily: 'monospace',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Total
                        </Typography>
                        {totalKm && (
                            <Typography sx={{ fontSize: '0.68rem', color: surface[200], fontFamily: 'monospace' }}>
                                {totalKm} km
                            </Typography>
                        )}
                        {totalMin && (
                            <Typography sx={{ fontSize: '0.68rem', color: surface[200], fontFamily: 'monospace' }}>
                                {totalMin} min
                            </Typography>
                        )}
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        variant="text"
                        onClick={onClose}
                        disabled={isSaving}
                        sx={{ color: surface[400], textTransform: 'none', fontSize: '0.8rem' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSalvar}
                        disabled={isSaving}
                        aria-label="Salvar"
                        sx={{
                            bgcolor: primary[500],
                            color: surface[900],
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            textTransform: 'none',
                            px: 2.5,
                            '&:hover': { bgcolor: '#bfef30' },
                            '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                        }}
                    >
                        {isSaving ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Salvar'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
