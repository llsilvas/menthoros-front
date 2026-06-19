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
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import type { PlanoSemanalDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';
import { content, semantic, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlanoDetalhePanelProps {
    plano: PlanoSemanalDto | null;
    isActing: boolean;
    onAprovar: () => void;
    onRejeitar: (motivo: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatarData(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

// ── Sessão individual ─────────────────────────────────────────────────────────

function SessaoRow({ treino }: { treino: TreinoPlanejadoDto }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                py: 1,
                borderBottom: `1px solid ${content.divider}`,
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: surface[400], minWidth: 64 }}>
                {treino.diaSemana}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: surface[100] }}>
                    {treino.tipoTreino}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: surface[400], mt: 0.25 }}>
                    {treino.distanciaKm} km{treino.duracaoMin ? ` · ${treino.duracaoMin}` : ''}
                </Typography>
                {treino.justificativaIa && (
                    <Typography
                        sx={{
                            fontSize: '0.72rem', color: surface[500], mt: 0.5,
                            fontStyle: 'italic', lineHeight: 1.4,
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
    };

    const handleClose = () => {
        if (isActing) return;
        setMotivo('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: surface[50] }}>
                Rejeitar plano
            </DialogTitle>
            <DialogContent>
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
                    helperText={`${motivo.length}/1000 caracteres`}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button
                    variant="text"
                    onClick={handleClose}
                    disabled={isActing}
                    sx={{ color: surface[400], textTransform: 'none' }}
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
                        fontWeight: 600,
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
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1.5, px: 3,
            }}
        >
            <PlaylistAddCheckIcon sx={{ fontSize: 52, color: surface[600] }} />
            <Typography sx={{ fontSize: '0.95rem', color: surface[400], textAlign: 'center' }}>
                Selecione um plano da lista para revisar
            </Typography>
        </Box>
    );
}

// ── Painel principal ──────────────────────────────────────────────────────────

export function PlanoDetalhePanel({ plano, isActing, onAprovar, onRejeitar }: PlanoDetalhePanelProps) {
    const [modalAberto, setModalAberto] = useState(false);

    if (!plano) return <EstadoVazio />;

    const sessoes = plano.treinosPlanejados ?? [];
    const periodo = `${formatarData(plano.semanaInicio)} → ${formatarData(plano.semanaFim)}`;

    const handleRejeitar = (motivo: string) => {
        setModalAberto(false);
        onRejeitar(motivo);
    };

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {/* Cabeçalho */}
            <Box
                sx={{
                    px: 2.5, py: 2,
                    borderBottom: `1px solid ${content.divider}`,
                    flexShrink: 0,
                }}
            >
                <Typography
                    sx={{ fontSize: '1rem', fontWeight: 700, color: surface[50], fontFamily: 'Syne, sans-serif' }}
                >
                    {plano.objetivoSemanal ?? 'Plano semanal'}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: surface[400], mt: 0.5 }}>
                    {periodo} · {plano.volumePlanejadoKm} km planejados
                </Typography>
            </Box>

            {/* Lista de sessões */}
            <Box
                sx={{
                    flex: 1, overflowY: 'auto',
                    px: 2.5, py: 2,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
                }}
            >
                {sessoes.length === 0 ? (
                    <Typography sx={{ fontSize: '0.85rem', color: surface[500], fontStyle: 'italic' }}>
                        Nenhuma sessão detalhada disponível.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            p: 1.5, borderRadius: '8px',
                            border: `1px solid ${content.cardBorder}`,
                            backgroundColor: elevation.card,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.7rem', fontWeight: 600, color: surface[500],
                                textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1,
                            }}
                        >
                            {sessoes.length} {sessoes.length === 1 ? 'sessão' : 'sessões'}
                        </Typography>
                        {sessoes.map((t, i) => (
                            <SessaoRow key={t.id ?? i} treino={t} />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Rodapé de ações */}
            <Box
                sx={{
                    px: 2.5, py: 2,
                    borderTop: `1px solid ${content.divider}`,
                    display: 'flex', gap: 1.5, flexWrap: 'wrap',
                    flexShrink: 0,
                }}
            >
                <Button
                    variant="contained"
                    onClick={onAprovar}
                    disabled={isActing}
                    sx={{
                        bgcolor: semantic.success[500],
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2.5,
                        minWidth: 100,
                        '&:hover': { bgcolor: semantic.success[700] },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                    }}
                >
                    {isActing
                        ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                        : 'Aprovar'}
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => setModalAberto(true)}
                    disabled={isActing}
                    sx={{
                        borderColor: semantic.danger[500],
                        color: semantic.danger[500],
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2.5,
                        minWidth: 100,
                        '&:hover': {
                            borderColor: semantic.danger[300],
                            backgroundColor: `${semantic.danger[500]}14`,
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
