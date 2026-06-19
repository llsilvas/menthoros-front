import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InboxIcon from '@mui/icons-material/Inbox';
import { SugestaoService } from '../../../api/services/SugestaoService';
import { useCoachSugestoes } from '../../../hooks/useCoachSugestoes';
import { elevation } from '../../../shared/design-tokens';
import { content, semantic, surface } from '../../../theme/tokens';
import type { SugestaoCoachOutputDto, SugestaoConfidence, SugestaoTipo } from '../../../types/SugestaoCoach';

// ── Configuração de exibição ──────────────────────────────────────────────────

const TIPO_LABEL: Record<SugestaoTipo, string> = {
    PLAN_ADJUST: 'Ajuste de Plano',
    RECOVERY:    'Recuperação',
    NEW_PLAN:    'Novo Plano',
};

const CONFIDENCE_CONFIG: Record<SugestaoConfidence, { color: string; label: string }> = {
    HIGH:   { color: semantic.danger[500],  label: 'Alta confiança'  },
    MEDIUM: { color: semantic.warning[500], label: 'Média confiança' },
    LOW:    { color: semantic.info[500],    label: 'Baixa confiança' },
};

// ── Sub-componentes ───────────────────────────────────────────────────────────

function TipoChip({ tipo }: { tipo: SugestaoTipo }) {
    return (
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
                bgcolor: `${surface[0]}1A`,
                border: `1px solid ${content.cardBorder}`,
                color: surface[300],
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                flexShrink: 0,
            }}
        >
            {TIPO_LABEL[tipo]}
        </Box>
    );
}

function ConfidenceChip({ confidence }: { confidence: SugestaoConfidence }) {
    const { color, label } = CONFIDENCE_CONFIG[confidence];
    return (
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
                border: `1px solid ${color}`,
                bgcolor: `${color}1A`,
                color,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                flexShrink: 0,
            }}
        >
            {label}
        </Box>
    );
}

// ── Painel esquerdo: lista ────────────────────────────────────────────────────

interface SugestaoListItemProps {
    item: SugestaoCoachOutputDto;
    selected: boolean;
    onClick: () => void;
}

function SugestaoListItem({ item, selected, onClick }: SugestaoListItemProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                p: 1.5,
                borderRadius: '8px',
                cursor: 'pointer',
                border: `1px solid ${selected ? semantic.info[500] : content.cardBorder}`,
                bgcolor: selected ? elevation.highest : elevation.card,
                transition: 'background 0.15s, border-color 0.15s',
                '&:hover': {
                    bgcolor: elevation.highest,
                    borderColor: selected ? semantic.info[500] : surface[600],
                },
            }}
        >
            <TipoChip tipo={item.tipo} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: surface[50], lineHeight: 1.3 }}>
                {item.athleteName}
            </Typography>
            <Typography
                sx={{
                    fontSize: '0.72rem',
                    color: surface[400],
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {item.summary}
            </Typography>
        </Box>
    );
}

// ── Painel direito: detalhe ───────────────────────────────────────────────────

interface DetalhePanelProps {
    sugestao: SugestaoCoachOutputDto | null;
    onAprovar: () => Promise<void>;
    onRejeitar: () => Promise<void>;
    aprovando: boolean;
    rejeitando: boolean;
}

function DetalhePanel({ sugestao, onAprovar, onRejeitar, aprovando, rejeitando }: DetalhePanelProps) {
    if (!sugestao) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    px: 4,
                    color: surface[600],
                }}
            >
                <InboxIcon sx={{ fontSize: 48 }} />
                <Typography sx={{ fontSize: '0.875rem' }}>
                    Selecione uma sugestão para ver o detalhe
                </Typography>
            </Box>
        );
    }

    const busy = aprovando || rejeitando;

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflowY: 'auto' }}>
            {/* Cabeçalho */}
            <Box>
                <Typography
                    sx={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: surface[50],
                        fontFamily: 'Syne, sans-serif',
                        mb: 0.75,
                    }}
                >
                    {sugestao.athleteName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <ConfidenceChip confidence={sugestao.confidence} />
                    <TipoChip tipo={sugestao.tipo} />
                </Box>
            </Box>

            {/* Resumo */}
            <Box>
                <Typography
                    sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: surface[100],
                        lineHeight: 1.55,
                    }}
                >
                    {sugestao.summary}
                </Typography>
            </Box>

            {/* Raciocínio */}
            {sugestao.reasoning?.rationale && (
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: '6px',
                        bgcolor: `${surface[0]}0A`,
                        border: `1px solid ${content.cardBorder}`,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: '0.775rem',
                            color: surface[400],
                            lineHeight: 1.55,
                            fontStyle: 'italic',
                        }}
                    >
                        {sugestao.reasoning.rationale}
                    </Typography>
                </Box>
            )}

            {/* Botões de ação */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', pt: 1 }}>
                <Button
                    variant="contained"
                    size="small"
                    disabled={busy}
                    onClick={onAprovar}
                    sx={{
                        bgcolor: semantic.success[500],
                        '&:hover': { bgcolor: semantic.success[700] },
                        '&:disabled': { bgcolor: `${semantic.success[500]}80` },
                        color: '#fff',
                        fontWeight: 600,
                        minWidth: 100,
                    }}
                >
                    {aprovando ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Aprovar'}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    disabled={busy}
                    onClick={onRejeitar}
                    sx={{
                        borderColor: semantic.danger[500],
                        color: semantic.danger[500],
                        '&:hover': { bgcolor: `${semantic.danger[500]}1A`, borderColor: semantic.danger[500] },
                        fontWeight: 600,
                        minWidth: 100,
                    }}
                >
                    {rejeitando ? <CircularProgress size={14} sx={{ color: semantic.danger[500] }} /> : 'Rejeitar'}
                </Button>
            </Box>
        </Box>
    );
}

// ── Estados auxiliares ────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                px: 3,
            }}
        >
            <CheckCircleIcon sx={{ fontSize: 56, color: semantic.success[500] }} />
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: surface[50], fontFamily: 'Syne, sans-serif' }}>
                Nenhuma sugestão pendente
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: surface[400], textAlign: 'center' }}>
                O sistema não identificou ações prioritárias no momento.
            </Typography>
        </Box>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ color: semantic.danger[500], fontSize: '0.875rem' }}>
                Não foi possível carregar as sugestões.
            </Typography>
            <Button
                variant="outlined"
                size="small"
                onClick={onRetry}
                sx={{ alignSelf: 'flex-start', borderColor: semantic.danger[500], color: semantic.danger[500] }}
            >
                Tentar novamente
            </Button>
        </Box>
    );
}

// ── Page principal ────────────────────────────────────────────────────────────

export default function CoachInboxPage() {
    const { sugestoes, loading, error, fetchSugestoes } = useCoachSugestoes();
    const [selected, setSelected] = useState<SugestaoCoachOutputDto | null>(null);
    const [aprovando, setAprovando] = useState(false);
    const [rejeitando, setRejeitando] = useState(false);

    useEffect(() => {
        fetchSugestoes();
    }, [fetchSugestoes]);

    // Mantém seleção sincronizada se a lista mudar (ex.: item aprovado desaparece)
    useEffect(() => {
        if (selected && !sugestoes.some((s) => s.id === selected.id)) {
            setSelected(null);
        }
    }, [sugestoes, selected]);

    const handleAprovar = async () => {
        if (!selected) return;
        setAprovando(true);
        try {
            await SugestaoService.aprovar(selected.id);
            await fetchSugestoes();
        } finally {
            setAprovando(false);
        }
    };

    const handleRejeitar = async () => {
        if (!selected) return;
        setRejeitando(true);
        try {
            await SugestaoService.rejeitar(selected.id);
            await fetchSugestoes();
        } finally {
            setRejeitando(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (error) {
        return <ErrorState onRetry={fetchSugestoes} />;
    }

    if (sugestoes.length === 0) {
        return <EmptyState />;
    }

    return (
        <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* Painel esquerdo: lista (30%) */}
            <Box
                sx={{
                    width: '30%',
                    minWidth: 220,
                    maxWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    p: 2,
                    borderRight: `1px solid ${content.divider}`,
                    overflowY: 'auto',
                }}
            >
                <Typography
                    sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: surface[400],
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        mb: 0.5,
                    }}
                >
                    {sugestoes.length} {sugestoes.length === 1 ? 'sugestão' : 'sugestões'} pendentes
                </Typography>
                {sugestoes.map((s) => (
                    <SugestaoListItem
                        key={s.id}
                        item={s}
                        selected={selected?.id === s.id}
                        onClick={() => setSelected(s)}
                    />
                ))}
            </Box>

            {/* Painel direito: detalhe (70%) */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <DetalhePanel
                    sugestao={selected}
                    onAprovar={handleAprovar}
                    onRejeitar={handleRejeitar}
                    aprovando={aprovando}
                    rejeitando={rejeitando}
                />
            </Box>
        </Box>
    );
}
