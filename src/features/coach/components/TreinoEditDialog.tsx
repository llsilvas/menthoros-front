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
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch, EtapaTreinoDto } from '../../../types/PlanoReview';

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

function blocoFromEtapa(e: EtapaTreinoDto): BlocoState {
    return {
        distanciaKm: e.distanciaKm != null ? String(e.distanciaKm) : '',
        duracaoMin:  e.duracaoMin != null ? String(e.duracaoMin) : '',
        zonaAlvo:    e.fcAlvoEtapa ?? '',
        rpe:         '',
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
    // Blocos obrigatórios em todos os tipos de treino
    const [aquecimento, setAquecimento]       = useState<BlocoState>(BLOCO_VAZIO);
    const [desaquecimento, setDesaquecimento] = useState<BlocoState>(BLOCO_VAZIO);
    // Rastreia se o usuário alterou algum bloco — evita incluir etapas em patches sem mudança
    const [blocosMudados, setBlocosMudados]   = useState(false);

    const isIntervalado = TIPOS_INTERVALADOS.has(tipoTreino);

    useEffect(() => {
        const etapas = treino.etapas;
        if (etapas?.length) {
            const aq        = etapas.find(e => e.tipoEtapa === 'AQUECIMENTO');
            const desaq     = etapas.find(e => e.tipoEtapa === 'DESAQUECIMENTO');
            const intervalados = etapas.filter(e => e.tipoEtapa === 'INTERVALADO');
            const esf       = intervalados[0] ?? etapas.find(e => e.tipoEtapa === 'PRINCIPAL');
            const rec       = etapas.find(e => e.tipoEtapa === 'RECUPERACAO');

            setAquecimento(aq   ? blocoFromEtapa(aq)   : BLOCO_VAZIO);
            setDesaquecimento(desaq ? blocoFromEtapa(desaq) : BLOCO_VAZIO);
            setPrincipal(esf   ? blocoFromEtapa(esf)   : blocoFromTreino(treino));
            setRecuperacao(rec ? blocoFromEtapa(rec)   : BLOCO_VAZIO);
            // IA gera N etapas individuais (repeticoes=1 cada) → conta etapas
            // Coach salva 1 etapa com repeticoes=N → usa o campo
            const rep = intervalados.length > 1
                ? intervalados.length
                : (esf?.repeticoes ?? 1);
            setRepeticoes(rep);
        } else {
            setAquecimento(BLOCO_VAZIO);
            setDesaquecimento(BLOCO_VAZIO);
            setPrincipal(blocoFromTreino(treino));
            setRecuperacao(BLOCO_VAZIO);
            setRepeticoes(1);
        }
        setTipoTreino(treino.tipoTreino ?? '');
        setTss(treino.tssPlanejado != null ? String(treino.tssPlanejado) : '');
        setObservacao(treino.observacao ?? '');
        setBlocosMudados(false);
    }, [treino]);

    const marcaBlocoMudado = () => setBlocosMudados(true);

    // Totais calculados em tempo real somando todos os blocos (aquecimento + principal + desaquecimento)
    const { totalKm, totalMin } = useMemo(() => {
        let km = 0;
        let min = 0;

        const soma = (b: BlocoState) => {
            km  += parseFloat(b.distanciaKm) || 0;
            min += parseInt(b.duracaoMin, 10) || 0;
        };

        soma(aquecimento);
        if (isIntervalado) {
            const rep = Math.max(1, repeticoes);
            km  += ((parseFloat(principal.distanciaKm) || 0) + (parseFloat(recuperacao.distanciaKm) || 0)) * rep;
            min += ((parseInt(principal.duracaoMin, 10) || 0) + (parseInt(recuperacao.duracaoMin, 10) || 0)) * rep;
        } else {
            soma(principal);
        }
        soma(desaquecimento);

        return {
            totalKm:  km  > 0 ? km.toFixed(1)  : null,
            totalMin: min > 0 ? String(min)     : null,
        };
    }, [isIntervalado, principal, recuperacao, repeticoes, aquecimento, desaquecimento]);

    const handleSalvar = () => {
        const patch: TreinoPlanejadoPatch = {};

        if (tipoTreino && tipoTreino !== treino.tipoTreino) patch.tipoTreino = tipoTreino;

        // Totals always include aquecimento + main block(s) + desaquecimento
        const distNum = totalKm ? parseFloat(totalKm) : NaN;
        const durMin  = totalMin ? parseInt(totalMin, 10) : NaN;

        if (!isNaN(distNum) && distNum !== treino.distanciaKm) patch.distanciaKm = distNum;

        const duracaoIso = toIso8601(String(durMin));
        if (duracaoIso && duracaoIso !== treino.duracaoMin) patch.duracaoMin = duracaoIso;

        if (principal.zonaAlvo && principal.zonaAlvo !== treino.zonaAlvo) patch.zonaAlvo = principal.zonaAlvo;

        const rpeNum = parseInt(principal.rpe, 10);
        if (!isNaN(rpeNum) && rpeNum !== treino.percepcaoEsforcoEsperada) patch.percepcaoEsforcoEsperada = rpeNum;

        const tssNum = parseInt(tss, 10);
        if (!isNaN(tssNum) && tssNum !== treino.tssPlanejado) patch.tssPlanejado = tssNum;

        if (observacao !== treino.observacao) patch.observacao = observacao || undefined;

        // Inclui etapas no patch apenas se o usuário alterou algum bloco
        if (blocosMudados) {
            const etapasPatch: EtapaTreinoDto[] = [];
            let ordem = 1;

            const distAq = parseFloat(aquecimento.distanciaKm) || undefined;
            const durAq  = parseInt(aquecimento.duracaoMin, 10) || undefined;
            if (distAq || durAq) {
                etapasPatch.push({ ordem: ordem++, tipoEtapa: 'AQUECIMENTO',
                    distanciaKm: distAq, duracaoMin: durAq, fcAlvoEtapa: aquecimento.zonaAlvo || undefined });
            }

            if (isIntervalado) {
                const rep    = Math.max(1, repeticoes);
                const distPr = parseFloat(principal.distanciaKm) || undefined;
                const durPr  = parseInt(principal.duracaoMin, 10) || undefined;
                if (distPr || durPr) {
                    etapasPatch.push({ ordem: ordem++, tipoEtapa: 'INTERVALADO', repeticoes: rep,
                        distanciaKm: distPr, duracaoMin: durPr, fcAlvoEtapa: principal.zonaAlvo || undefined });
                }
                const distRec = parseFloat(recuperacao.distanciaKm) || undefined;
                const durRec  = parseInt(recuperacao.duracaoMin, 10) || undefined;
                if (distRec || durRec) {
                    etapasPatch.push({ ordem: ordem++, tipoEtapa: 'RECUPERACAO', repeticoes: rep,
                        distanciaKm: distRec, duracaoMin: durRec, fcAlvoEtapa: recuperacao.zonaAlvo || undefined });
                }
            } else {
                const distPr = parseFloat(principal.distanciaKm) || undefined;
                const durPr  = parseInt(principal.duracaoMin, 10) || undefined;
                if (distPr || durPr) {
                    etapasPatch.push({ ordem: ordem++, tipoEtapa: 'PRINCIPAL',
                        distanciaKm: distPr, duracaoMin: durPr, fcAlvoEtapa: principal.zonaAlvo || undefined });
                }
            }

            const distDq = parseFloat(desaquecimento.distanciaKm) || undefined;
            const durDq  = parseInt(desaquecimento.duracaoMin, 10) || undefined;
            if (distDq || durDq) {
                etapasPatch.push({ ordem: ordem++, tipoEtapa: 'DESAQUECIMENTO',
                    distanciaKm: distDq, duracaoMin: durDq, fcAlvoEtapa: desaquecimento.zonaAlvo || undefined });
            }

            if (etapasPatch.length > 0) patch.etapas = etapasPatch;
        }

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

                {/* ── Aquecimento — presente em todos os tipos ── */}
                <BlocoCard
                    label="Aquecimento"
                    accent={ACCENT.aquecimento}
                    bloco={aquecimento}
                    onChange={b => { setAquecimento(b); marcaBlocoMudado(); }}
                    disabled={isSaving}
                />

                {isIntervalado ? (
                    /* ── Série (Intervalado / Fartlek) ── */
                    <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
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
                                    onClick={() => { setRepeticoes(r => Math.max(1, r - 1)); marcaBlocoMudado(); }}
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
                                    onClick={() => { setRepeticoes(r => Math.min(20, r + 1)); marcaBlocoMudado(); }}
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
                                onChange={b => { setPrincipal(b); marcaBlocoMudado(); }}
                                disabled={isSaving}
                            />
                            <BlocoCard
                                label="Recuperação"
                                accent={ACCENT.recuperacao}
                                bloco={recuperacao}
                                onChange={b => { setRecuperacao(b); marcaBlocoMudado(); }}
                                disabled={isSaving}
                            />
                        </Box>
                    </Box>
                ) : (
                    /* ── Bloco principal (tipos simples) ── */
                    <BlocoCard
                        label="Treino"
                        accent={ACCENT.principal}
                        bloco={principal}
                        onChange={b => { setPrincipal(b); marcaBlocoMudado(); }}
                        disabled={isSaving}
                    />
                )}

                {/* ── Desaquecimento — presente em todos os tipos ── */}
                <BlocoCard
                    label="Desaquecimento"
                    accent={ACCENT.desaquecimento}
                    bloco={desaquecimento}
                    onChange={b => { setDesaquecimento(b); marcaBlocoMudado(); }}
                    disabled={isSaving}
                />

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
