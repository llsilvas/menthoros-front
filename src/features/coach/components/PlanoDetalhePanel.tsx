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
    Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
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

// ── Sessão individual ─────────────────────────────────────────────────────────

function SessaoRow({ treino, maxKm }: { treino: TreinoPlanejadoDto; maxKm: number }) {
    const cor = tipoColor(treino.tipoTreino);
    const barWidth = maxKm > 0 ? Math.round((treino.distanciaKm / maxKm) * 100) : 0;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr',
                gap: 1.5,
                py: 1.25,
                borderBottom: `1px solid ${content.divider}`,
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            {/* Dia */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start', pt: 0.25 }}>
                <Box
                    sx={{
                        width: 6, height: 6, borderRadius: '50%',
                        bgcolor: cor, flexShrink: 0,
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: surface[400],
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        lineHeight: 1,
                    }}
                >
                    {resolverDiaSemana(treino.diaSemana)}
                </Typography>
            </Box>

            {/* Conteúdo */}
            <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                        sx={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: surface[100],
                            lineHeight: 1.2,
                        }}
                    >
                        {treino.tipoTreino.replace(/_/g, ' ')}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: cor,
                        }}
                    >
                        {treino.distanciaKm} km
                    </Typography>
                    {treino.duracaoMin && (
                        <Typography sx={{ fontSize: '0.68rem', color: surface[500] }}>
                            {treino.duracaoMin}
                        </Typography>
                    )}
                </Box>

                {/* Barra de distância */}
                <Box
                    sx={{
                        height: 2,
                        bgcolor: `${surface[0]}0F`,
                        borderRadius: 1,
                        mb: treino.justificativaIa ? 0.75 : 0,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${barWidth}%`,
                            bgcolor: cor,
                            borderRadius: 1,
                            opacity: 0.7,
                            transition: 'width 0.6s ease',
                        }}
                    />
                </Box>

                {treino.justificativaIa && (
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            color: surface[500],
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                        }}
                    >
                        {treino.justificativaIa}
                    </Typography>
                )}
            </Box>
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
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.85rem',
                        },
                    }}
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
                    startIcon={isActing ? undefined : <AssignmentLateOutlinedIcon sx={{ fontSize: 16 }} />}
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                px: 4,
                opacity: 0.5,
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    border: `1.5px dashed ${surface[600]}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CheckCircleOutlineIcon sx={{ fontSize: 22, color: surface[500] }} />
            </Box>
            <Typography
                sx={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: surface[500],
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                }}
            >
                Selecione um plano para revisar
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

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
    AGUARDANDO_REVISAO: { label: 'AGUARDANDO REVISÃO', color: '#F59E0B', bg: '#F59E0B22' },
    APROVADO:           { label: 'APROVADO',            color: '#10B981', bg: '#10B98122' },
    REJEITADO:          { label: 'REJEITADO',           color: '#EF4444', bg: '#EF444422' },
};

export function PlanoDetalhePanel({ plano, isActing, onAprovar, onRejeitar }: PlanoDetalhePanelProps) {
    const [modalAberto, setModalAberto] = useState(false);

    if (!plano) return <EstadoVazio />;

    const sessoes = plano.treinosPlanejados ?? [];
    const maxKm = Math.max(...sessoes.map((s) => s.distanciaKm), 0);
    const periodo = `${formatarData(plano.semanaInicio)} – ${formatarData(plano.semanaFim)}`;
    const isAguardando = plano.reviewStatus === 'AGUARDANDO_REVISAO';
    const chipStyle = STATUS_CHIP[plano.reviewStatus] ?? STATUS_CHIP.AGUARDANDO_REVISAO;

    const handleRejeitar = (motivo: string) => {
        setModalAberto(false);
        onRejeitar(motivo);
    };

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* ── Cabeçalho editorial ────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    pt: 2.5,
                    pb: 2,
                    borderBottom: `1px solid ${content.divider}`,
                    flexShrink: 0,
                    bgcolor: `${primary[500]}06`,
                }}
            >
                <Chip
                    label={chipStyle.label}
                    size="small"
                    sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        bgcolor: chipStyle.bg,
                        color: chipStyle.color,
                        border: `1px solid ${chipStyle.color}33`,
                        borderRadius: '4px',
                        mb: 1,
                        '& .MuiChip-label': { px: 1 },
                    }}
                />

                <Typography
                    sx={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: surface[50],
                        lineHeight: 1.2,
                        mb: 0.75,
                    }}
                >
                    {plano.objetivoSemanal ?? 'Plano Semanal'}
                </Typography>

                {/* Stats row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                    <StatItem label="Período" value={periodo} />
                    <Divider />
                    <StatItem
                        label="Volume"
                        value={`${plano.volumePlanejadoKm} km`}
                        accent
                    />
                    {plano.volumeAlvoKm > 0 && (
                        <>
                            <Divider />
                            <StatItem label="Alvo" value={`${plano.volumeAlvoKm} km`} />
                        </>
                    )}
                    {sessoes.length > 0 && (
                        <>
                            <Divider />
                            <StatItem label="Sessões" value={String(sessoes.length)} />
                        </>
                    )}
                </Box>
            </Box>

            {/* ── Sessões ────────────────────────────────────────────────── */}
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
                    <Typography sx={{ fontSize: '0.82rem', color: surface[500], fontStyle: 'italic', mt: 1 }}>
                        Nenhuma sessão detalhada disponível.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            borderRadius: '8px',
                            border: `1px solid ${content.cardBorder}`,
                            bgcolor: elevation.card,
                            overflow: 'hidden',
                            px: 2,
                            py: 0.5,
                        }}
                    >
                        {sessoes.map((t, i) => (
                            <SessaoRow key={t.id ?? i} treino={t} maxKm={maxKm} />
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Ações ──────────────────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${content.divider}`,
                    display: 'flex',
                    gap: 1.5,
                    flexShrink: 0,
                    bgcolor: `${surface[0]}04`,
                }}
            >
                <Button
                    variant="contained"
                    onClick={onAprovar}
                    disabled={isActing || !isAguardando}
                    startIcon={isActing ? undefined : <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    sx={{
                        bgcolor: primary[500],
                        color: surface[900],
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        letterSpacing: '0.01em',
                        px: 2.5,
                        minWidth: 120,
                        boxShadow: `0 0 20px ${primary[500]}40`,
                        '&:hover': {
                            bgcolor: primary[400],
                            boxShadow: `0 0 28px ${primary[500]}60`,
                        },
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
                        borderColor: `${semantic.danger[500]}60`,
                        color: semantic.danger[500],
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2.5,
                        minWidth: 100,
                        '&:hover': {
                            borderColor: semantic.danger[500],
                            bgcolor: `${semantic.danger[500]}10`,
                        },
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

// ── Sub-componentes internos ───────────────────────────────────────────────────

function StatItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <Box>
            <Typography sx={{ fontSize: '0.6rem', color: surface[500], fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>
                {label}
            </Typography>
            <Typography
                sx={{
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: accent ? primary[400] : surface[200],
                    lineHeight: 1.4,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

function Divider() {
    return (
        <Box sx={{ width: 1, height: 24, bgcolor: `${surface[0]}18`, flexShrink: 0 }} />
    );
}
