import { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import type { DiaSemanaDto, PlanoSemanalDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolverDiaSemana(dia: string | DiaSemanaDto): string {
    if (typeof dia === 'string') return dia;
    return dia.short ?? dia.label ?? dia.value;
}

function formatarData(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short',
    });
}

const TIPO_ABBREV: Record<string, string> = {
    FACIL: 'FCL',
    LONGO: 'LNG',
    TEMPO: 'TMP',
    INTERVALADO: 'INT',
    RECUPERACAO: 'REC',
    FARTLEK: 'FTK',
    CORRIDA_CONTINUA: 'CC',
};

const TIPO_COLORS: Record<string, string> = {
    FACIL: '#94A3B8',
    LONGO: '#3B82F6',
    TEMPO: '#F59E0B',
    INTERVALADO: '#EF4444',
    RECUPERACAO: '#10B981',
    FARTLEK: '#A855F7',
    CORRIDA_CONTINUA: '#3B82F6',
    DEFAULT: '#64748B',
};

function tipoColor(tipo: string): string {
    return TIPO_COLORS[tipo?.toUpperCase()] ?? TIPO_COLORS.DEFAULT;
}

function tipoAbbrev(tipo: string): string {
    return TIPO_ABBREV[tipo?.toUpperCase()] ?? tipo.slice(0, 3).toUpperCase();
}

// ── Tag de treino ─────────────────────────────────────────────────────────────

function TreinoTag({ treino }: { treino: TreinoPlanejadoDto }) {
    const cor = tipoColor(treino.tipoTreino);
    const abbrev = tipoAbbrev(treino.tipoTreino);
    const dia = resolverDiaSemana(treino.diaSemana).slice(0, 3).toUpperCase();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.75,
                borderRadius: '6px',
                border: `1px solid ${cor}28`,
                bgcolor: `${cor}0C`,
                flexShrink: 0,
            }}
        >
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: cor, flexShrink: 0 }} />
            <Typography
                sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: surface[400],
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                }}
            >
                {dia}
            </Typography>
            <Typography
                sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: cor,
                    lineHeight: 1,
                }}
            >
                {treino.distanciaKm}k
            </Typography>
            <Typography
                sx={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: surface[500],
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                }}
            >
                {abbrev}
            </Typography>
        </Box>
    );
}

// ── Modal de rejeição ─────────────────────────────────────────────────────────

interface RejeicaoModalProps {
    open: boolean;
    isActing: boolean;
    onClose: () => void;
    onConfirmar: (motivo: string) => void;
}

function RejeicaoModal({ open, isActing, onClose, onConfirmar }: RejeicaoModalProps) {
    const [motivo, setMotivo] = useState('');

    const handleConfirmar = () => {
        if (!motivo.trim()) return;
        onConfirmar(motivo.trim());
        setMotivo('');
    };

    const handleClose = () => {
        if (isActing) return;
        setMotivo('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
                    pb: 1,
                }}
            >
                Rejeitar plano
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '0.8rem', color: surface[400], mb: 1.5 }}>
                    Explique ao atleta o motivo pelo qual este plano não será utilizado.
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    multiline
                    rows={4}
                    label="Motivo da rejeição"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    disabled={isActing}
                    inputProps={{ maxLength: 1000 }}
                    helperText={`${motivo.length}/1000`}
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button
                    variant="text"
                    onClick={handleClose}
                    disabled={isActing}
                    sx={{ color: surface[400], textTransform: 'none', fontSize: '0.8rem' }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirmar}
                    disabled={!motivo.trim() || isActing}
                    sx={{
                        bgcolor: semantic.danger[500],
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        px: 2.5,
                        '&:hover': { bgcolor: semantic.danger[700] },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                    }}
                >
                    {isActing
                        ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                        : 'Confirmar rejeição'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Estado vazio ──────────────────────────────────────────────────────────────

function EstadoVazio() {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.35,
            }}
        >
            <Typography
                sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: surface[500],
                    letterSpacing: '0.04em',
                }}
            >
                Selecione um plano
            </Typography>
        </Box>
    );
}

// ── Métrica ───────────────────────────────────────────────────────────────────

function Metrica({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
                sx={{
                    fontSize: '0.58rem',
                    fontWeight: 600,
                    color: surface[600],
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: accent ? primary[400] : surface[200],
                    lineHeight: 1,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

// ── Painel principal ──────────────────────────────────────────────────────────

interface PlanoDetalhePanelProps {
    plano: PlanoSemanalDto | null;
    isActing: boolean;
    onAprovar: () => void;
    onRejeitar: (motivo: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
    AGUARDANDO_REVISAO: '#F59E0B',
    APROVADO: '#10B981',
    REJEITADO: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
    AGUARDANDO_REVISAO: 'Aguardando',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
};

export function PlanoDetalhePanel({ plano, isActing, onAprovar, onRejeitar }: PlanoDetalhePanelProps) {
    const [modalAberto, setModalAberto] = useState(false);

    if (!plano) return <EstadoVazio />;

    const sessoes = plano.treinosPlanejados ?? [];
    const periodo = `${formatarData(plano.semanaInicio)} – ${formatarData(plano.semanaFim)}`;
    const reviewStatusValue = resolveReviewStatus(plano.reviewStatus);
    const isAguardando = reviewStatusValue === 'AGUARDANDO_REVISAO';
    const statusColor = STATUS_COLOR[reviewStatusValue] ?? STATUS_COLOR.AGUARDANDO_REVISAO;
    const statusLabel = STATUS_LABEL[reviewStatusValue] ?? reviewStatusValue;

    const handleRejeitar = (motivo: string) => {
        setModalAberto(false);
        onRejeitar(motivo);
    };

    const tsbLabel = plano.tsbInicio != null
        ? (plano.tsbInicio >= 0 ? `+${plano.tsbInicio.toFixed(1)}` : `${plano.tsbInicio.toFixed(1)}`)
        : '—';

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* ── Cabeçalho ─────────────────────────────────────────────── */}
            <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>

                {/* Status + período */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: statusColor,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {statusLabel}
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.65rem',
                            color: surface[600],
                            letterSpacing: '0.02em',
                        }}
                    >
                        {periodo}
                    </Typography>
                </Box>

                {/* Nome do atleta */}
                <Typography
                    sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: surface[50],
                        lineHeight: 1.15,
                        letterSpacing: '-0.01em',
                        mb: 0,
                    }}
                >
                    {plano.atletaNome ?? 'Atleta'}
                </Typography>
            </Box>

            {/* ── Métricas ──────────────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    py: 1.75,
                    borderBottom: `1px solid ${content.divider}`,
                    display: 'flex',
                    gap: 3,
                    flexShrink: 0,
                }}
            >
                <Metrica label="Volume" value={`${plano.volumePlanejadoKm} km`} accent />
                {plano.volumeAlvoKm > 0 && (
                    <Metrica label="Alvo" value={`${plano.volumeAlvoKm} km`} />
                )}
                <Metrica label="TSB" value={tsbLabel} />
                {sessoes.length > 0 && (
                    <Metrica label="Sessões" value={String(sessoes.length)} />
                )}
            </Box>

            {/* ── Treinos ───────────────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 3,
                    py: 2,
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
                }}
            >
                {sessoes.length === 0 ? (
                    <Typography sx={{ fontSize: '0.75rem', color: surface[600], fontStyle: 'italic' }}>
                        Nenhuma sessão disponível.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {sessoes.map((t, i) => (
                            <TreinoTag key={t.id ?? i} treino={t} />
                        ))}
                    </Box>
                )}

                {plano.reviewComment && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: '6px',
                            border: `1px solid ${semantic.danger[500]}28`,
                            bgcolor: `${semantic.danger[500]}08`,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: semantic.danger[300],
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            Motivo de rejeição
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: surface[400], lineHeight: 1.5 }}>
                            {plano.reviewComment}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Ações ─────────────────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${content.divider}`,
                    display: 'flex',
                    gap: 1.5,
                    flexShrink: 0,
                }}
            >
                <Button
                    variant="contained"
                    onClick={onAprovar}
                    disabled={isActing || !isAguardando}
                    sx={{
                        flex: 1,
                        bgcolor: primary[500],
                        color: surface[900],
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        boxShadow: isAguardando ? `0 0 20px ${primary[500]}40` : 'none',
                        '&:hover': { bgcolor: primary[400], boxShadow: `0 0 28px ${primary[500]}60` },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500], boxShadow: 'none' },
                    }}
                >
                    {isActing ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Aprovar'}
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => setModalAberto(true)}
                    disabled={isActing || !isAguardando}
                    sx={{
                        flex: 1,
                        borderColor: `${semantic.danger[500]}60`,
                        color: semantic.danger[500],
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        '&:hover': { borderColor: semantic.danger[500], bgcolor: `${semantic.danger[500]}10` },
                        '&.Mui-disabled': { borderColor: surface[700], color: surface[500] },
                    }}
                >
                    Rejeitar
                </Button>
            </Box>

            <RejeicaoModal
                open={modalAberto}
                isActing={isActing}
                onClose={() => setModalAberto(false)}
                onConfirmar={handleRejeitar}
            />
        </Box>
    );
}
