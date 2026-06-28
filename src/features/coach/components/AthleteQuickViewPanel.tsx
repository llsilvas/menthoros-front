import { useState } from 'react';
import { Box, Typography, Button, Chip, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import {
    OpenInNew as OpenInNewIcon,
    ExpandLess as ExpandLessIcon,
    ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { PMCChart, type PMCRange } from '../../athlete/components/PMCChart';
import { useAthletePmc } from '../../../hooks/useAthletePmc';
import { CoachAthleteAvatar } from './CoachAthleteAvatar';
import { PhaseIndicator, type TrainingPhase } from '../../../shared/components/PhaseIndicator';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { formFromTSB, formVariantColor, formVariantLabel } from '../types/AthleteForm';
import { surface, semantic, glassSx } from '../../../theme/tokens';
import type { CoachAtletaStatus } from '../../../types/Coach';

// ── Tipos ───────────────────────────────────────────────────────────────────

/** Snapshot do roster passado ao painel — renderiza na hora, enquanto a série PMC carrega. */
export interface AthleteQuickViewSnapshot {
    id: string;
    name: string;
    phase?: string;
    status: CoachAtletaStatus;
    ctl?: number;
    atl?: number;
    tsb?: number;
    weeklyVolume: number;
}

export interface AthleteQuickViewPanelProps {
    snapshot: AthleteQuickViewSnapshot;
    /** Navega para o perfil completo (`/coach/athletes/:id`). */
    onVerPerfilCompleto: () => void;
    /** Recolhe o painel (opcional). */
    onClose?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CoachAtletaStatus, string> = {
    active: 'Ativo',
    warning: 'Atenção',
    danger: 'Alerta',
    paused: 'Pausado',
};

const TRAINING_PHASES: readonly TrainingPhase[] = ['BASE', 'BUILD', 'ESPECIFICO', 'TAPER', 'RECOVERY'];

function asTrainingPhase(fase?: string): TrainingPhase | null {
    return fase && (TRAINING_PHASES as readonly string[]).includes(fase) ? (fase as TrainingPhase) : null;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SnapshotStat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 56 }}>
            <Typography sx={{ fontSize: '0.65rem', color: surface[500], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>
            <Typography
                sx={{ fontSize: '1rem', fontWeight: 700, color: color ?? surface[50], fontVariantNumeric: 'tabular-nums' }}
            >
                {value}
            </Typography>
        </Box>
    );
}

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * Painel de visão rápida do atleta no roster do coach: snapshot de carga/forma (imediato,
 * via props do roster) + gráfico de tendência PMC (série coach-scoped, buscada ao expandir).
 * Independe do mecanismo de expansão da página — recebe tudo por props.
 */
export function AthleteQuickViewPanel({ snapshot, onVerPerfilCompleto, onClose }: AthleteQuickViewPanelProps) {
    const [range, setRange] = useState<PMCRange>('12w');
    const { data, isLoading, error, refetch } = useAthletePmc(snapshot.id);

    const phase = asTrainingPhase(snapshot.phase);
    const forma = snapshot.tsb != null ? formFromTSB(snapshot.tsb) : null;

    return (
        <Box sx={{ ...glassSx, borderRadius: 2, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* ── Cabeçalho ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <CoachAthleteAvatar athlete={{ id: snapshot.id, name: snapshot.name }} size="sm" status="none" />
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: surface[50] }}>{snapshot.name}</Typography>
                {phase && <PhaseIndicator phase={phase} variant="pill" />}
                <StatusBadge variant={snapshot.status} label={STATUS_LABEL[snapshot.status]} size="sm" />
                {onClose && (
                    <Box sx={{ ml: 'auto' }}>
                        <Tooltip title="Recolher">
                            <IconButton size="small" onClick={onClose} aria-label="Recolher painel" sx={{ color: surface[400] }}>
                                <ExpandLessIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* ── Chips de snapshot (render imediato via props do roster) ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <SnapshotStat label="CTL" value={snapshot.ctl ?? '—'} />
                <SnapshotStat label="ATL" value={snapshot.atl ?? '—'} />
                <SnapshotStat
                    label="TSB"
                    value={snapshot.tsb ?? '—'}
                    color={forma ? formVariantColor[forma] : undefined}
                />
                {forma && (
                    <Chip
                        label={formVariantLabel[forma]}
                        size="small"
                        sx={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: formVariantColor[forma],
                            backgroundColor: `${formVariantColor[forma]}1A`,
                            border: `1px solid ${formVariantColor[forma]}40`,
                        }}
                    />
                )}
                <SnapshotStat label="Volume" value={`${snapshot.weeklyVolume} km`} />
            </Box>

            {/* ── Gráfico de tendência (série coach-scoped, lazy) ── */}
            {error ? (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => { void refetch(); }}>
                            Tentar novamente
                        </Button>
                    }
                >
                    Não foi possível carregar a tendência de PMC deste atleta.
                </Alert>
            ) : isLoading && data.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={28} />
                </Box>
            ) : data.length === 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        py: 4,
                        color: surface[500],
                    }}
                >
                    <ShowChartIcon sx={{ fontSize: 28, color: surface[600] }} />
                    <Typography sx={{ fontSize: '0.85rem' }}>Sem histórico de PMC para exibir ainda.</Typography>
                </Box>
            ) : (
                <PMCChart data={data} range={range} defaultMode="advanced" onRangeChange={setRange} />
            )}

            {/* ── CTA: perfil completo ── */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewIcon />}
                    onClick={onVerPerfilCompleto}
                    sx={{ color: semantic.info[500], fontWeight: 600 }}
                >
                    Ver perfil completo
                </Button>
            </Box>
        </Box>
    );
}

export default AthleteQuickViewPanel;
