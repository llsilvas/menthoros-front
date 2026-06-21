import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { content, primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';

// ── Helpers de duração ISO-8601 ───────────────────────────────────────────────

function parseDuracaoMinutos(iso?: string): string {
    if (!iso) return '';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return '';
    const h = parseInt(match[1] ?? '0', 10);
    const m = parseInt(match[2] ?? '0', 10);
    const total = h * 60 + m;
    return total > 0 ? String(total) : '';
}

function toIso8601(minutos: string): string | undefined {
    const n = parseInt(minutos, 10);
    return isNaN(n) || n <= 0 ? undefined : `PT${n}M`;
}

// ── Opções de tipo de treino (espelha backend TipoTreino enum) ────────────────

const TIPOS_TREINO = [
    { value: 'FACIL',           label: 'Fácil' },
    { value: 'LONGO',           label: 'Longo' },
    { value: 'TEMPO',           label: 'Tempo' },
    { value: 'INTERVALADO',     label: 'Intervalado' },
    { value: 'RECUPERACAO',     label: 'Recuperação' },
    { value: 'FARTLEK',         label: 'Fartlek' },
    { value: 'CORRIDA_CONTINUA', label: 'Corrida Contínua' },
    { value: 'CONTINUO',        label: 'Contínuo' },
];

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface TreinoEditDialogProps {
    open: boolean;
    treino: TreinoPlanejadoDto;
    isSaving: boolean;
    onClose: () => void;
    onSave: (patch: TreinoPlanejadoPatch) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TreinoEditDialog({ open, treino, isSaving, onClose, onSave }: TreinoEditDialogProps) {
    const [tipoTreino, setTipoTreino]       = useState(treino.tipoTreino ?? '');
    const [distancia, setDistancia]         = useState(treino.distanciaKm != null ? String(treino.distanciaKm) : '');
    const [duracaoMin, setDuracaoMin]       = useState(parseDuracaoMinutos(treino.duracaoMin));
    const [zonaAlvo, setZonaAlvo]           = useState(treino.zonaAlvo ?? '');
    const [rpe, setRpe]                     = useState(treino.percepcaoEsforcoEsperada != null ? String(treino.percepcaoEsforcoEsperada) : '');
    const [tss, setTss]                     = useState(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
    const [observacao, setObservacao]       = useState(treino.observacao ?? '');

    // Re-sincroniza quando o treino muda (ex: novo treino selecionado)
    useEffect(() => {
        setTipoTreino(treino.tipoTreino ?? '');
        setDistancia(treino.distanciaKm != null ? String(treino.distanciaKm) : '');
        setDuracaoMin(parseDuracaoMinutos(treino.duracaoMin));
        setZonaAlvo(treino.zonaAlvo ?? '');
        setRpe(treino.percepcaoEsforcoEsperada != null ? String(treino.percepcaoEsforcoEsperada) : '');
        setTss(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
        setObservacao(treino.observacao ?? '');
    }, [treino]);

    const handleSalvar = () => {
        const patch: TreinoPlanejadoPatch = {};

        if (tipoTreino && tipoTreino !== treino.tipoTreino) patch.tipoTreino = tipoTreino;

        const distNum = parseFloat(distancia);
        if (!isNaN(distNum) && distNum !== treino.distanciaKm) patch.distanciaKm = distNum;

        const duracaoIso = toIso8601(duracaoMin);
        if (duracaoIso !== undefined && duracaoIso !== treino.duracaoMin) patch.duracaoMin = duracaoIso;

        if (zonaAlvo && zonaAlvo !== treino.zonaAlvo) patch.zonaAlvo = zonaAlvo;

        const rpeNum = parseInt(rpe, 10);
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

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            fontSize: '0.85rem',
            bgcolor: content.inputBg,
            '& fieldset': { borderColor: content.inputBorder },
            '&:hover fieldset': { borderColor: content.inputBorderFocus },
            '&.Mui-focused fieldset': { borderColor: primary[500] },
        },
        '& .MuiInputLabel-root': { fontSize: '0.8rem', color: surface[400] },
        '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
    };

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: elevation.highest,
                    border: `1px solid ${content.cardBorder}`,
                    borderRadius: '12px',
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: surface[50],
                    pb: 0.5,
                }}
            >
                Editar treino
            </DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', color: surface[400] }}>
                    Campos não alterados são ignorados. O TSS será recalculado automaticamente se distância ou duração mudarem.
                </Typography>

                {/* Tipo de treino */}
                <Box>
                    <Typography sx={{ fontSize: '0.72rem', color: surface[500], mb: 0.5 }}>Tipo de treino</Typography>
                    <Select
                        value={tipoTreino}
                        onChange={(e) => setTipoTreino(e.target.value)}
                        size="small"
                        fullWidth
                        disabled={isSaving}
                        sx={{
                            fontSize: '0.85rem',
                            bgcolor: content.inputBg,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: content.inputBorder },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: content.inputBorderFocus },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary[500] },
                            color: surface[200],
                        }}
                        MenuProps={{ PaperProps: { sx: { bgcolor: elevation.highest } } }}
                    >
                        {TIPOS_TREINO.map((t) => (
                            <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.85rem' }}>
                                {t.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                {/* Distância e duração */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Distância (km)"
                        type="number"
                        value={distancia}
                        onChange={(e) => setDistancia(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={inputSx}
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
                        sx={inputSx}
                    />
                </Box>

                {/* Zona alvo e RPE */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Zona alvo"
                        value={zonaAlvo}
                        onChange={(e) => setZonaAlvo(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        sx={inputSx}
                    />
                    <TextField
                        label="RPE esperado (1–10)"
                        type="number"
                        value={rpe}
                        onChange={(e) => setRpe(e.target.value)}
                        disabled={isSaving}
                        size="small"
                        fullWidth
                        inputProps={{ min: 1, max: 10, step: 1 }}
                        sx={inputSx}
                    />
                </Box>

                {/* TSS */}
                <TextField
                    label="TSS planejado (opcional)"
                    placeholder="Deixar em branco para calcular automaticamente"
                    type="number"
                    value={tss}
                    onChange={(e) => setTss(e.target.value)}
                    disabled={isSaving}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: 500, step: 1 }}
                    sx={inputSx}
                />

                {/* Observação */}
                <TextField
                    label="Observação"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    disabled={isSaving}
                    multiline
                    rows={3}
                    fullWidth
                    inputProps={{ maxLength: 500 }}
                    sx={inputSx}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
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
                        '&:hover': { bgcolor: primary[400] },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                    }}
                >
                    {isSaving ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Salvar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
