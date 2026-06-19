import { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { SugestaoService } from '../../../api/services/SugestaoService';
import { ConfidenceBar } from '../../../shared/components/ConfidenceBar';
import { SuggestionTypeBadge } from '../../../shared/components/SuggestionTypeBadge';
import type { SuggestionType } from '../../../shared/components/SuggestionTypeBadge';
import { CoachAthleteAvatar } from '../components/CoachAthleteAvatar';
import { elevation } from '../../../shared/design-tokens';
import { content, primary, semantic, surface } from '../../../theme/tokens';
import type { SugestaoCoachOutputDto, SugestaoConfidence, SugestaoStatus, SugestaoTipo } from '../../../types/SugestaoCoach';

// ── Adaptadores de tipo (API uppercase → componentes lowercase) ───────────────

function toSuggestionType(tipo: SugestaoTipo): SuggestionType {
    const map: Record<SugestaoTipo, SuggestionType> = {
        PLAN_ADJUST: 'plan_adjust',
        RECOVERY:    'recovery',
        NEW_PLAN:    'new_plan',
    };
    return map[tipo];
}

function toConfidenceValue(confidence: SugestaoConfidence): number {
    return { HIGH: 90, MEDIUM: 65, LOW: 35 }[confidence];
}

// ── Tipos e constantes do filtro ──────────────────────────────────────────────

type FilterOption = 'all' | SugestaoStatus;

interface FilterChip { value: FilterOption; label: string }

const FILTER_CHIPS: FilterChip[] = [
    { value: 'all',      label: 'Todas'      },
    { value: 'PENDING',  label: 'Pendentes'  },
    { value: 'APPROVED', label: 'Aprovadas'  },
    { value: 'REJECTED', label: 'Rejeitadas' },
];

// ── Coluna de filtros (80px) ──────────────────────────────────────────────────

function FilterColumn({
    activeFilter,
    onFilterChange,
}: {
    activeFilter: FilterOption;
    onFilterChange: (f: FilterOption) => void;
}) {
    return (
        <Box
            sx={{
                width: 80,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                py: 2,
                px: 0.5,
                borderRight: `1px solid ${content.divider}`,
            }}
        >
            {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.value;
                return (
                    <Box
                        key={chip.value}
                        component="button"
                        onClick={() => onFilterChange(chip.value)}
                        sx={{
                            display:         'flex',
                            alignItems:      'center',
                            justifyContent:  'center',
                            textAlign:       'center',
                            border:          'none',
                            borderRadius:    '6px',
                            cursor:          'pointer',
                            px:              0.75,
                            py:              0.75,
                            fontSize:        '0.7rem',
                            fontWeight:      500,
                            lineHeight:      1.3,
                            transition:      'background-color 0.15s ease, color 0.15s ease',
                            backgroundColor: isActive ? primary[500] : surface[700],
                            color:           isActive ? surface[900] : surface[400],
                            '&:hover': {
                                backgroundColor: isActive ? primary[400] : surface[600],
                            },
                        }}
                    >
                        {chip.label}
                    </Box>
                );
            })}
        </Box>
    );
}

// ── Card da lista (coluna central) ────────────────────────────────────────────

function SuggestionCard({
    item,
    isSelected,
    onClick,
}: {
    item: SugestaoCoachOutputDto;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display:         'flex',
                flexDirection:   'column',
                gap:             1,
                px:              1.5,
                py:              1.25,
                cursor:          'pointer',
                borderRadius:    '8px',
                border:          `1px solid ${isSelected ? primary[500] : content.cardBorder}`,
                backgroundColor: isSelected ? `${primary[500]}0D` : elevation.card,
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': {
                    borderColor:     primary[500],
                    backgroundColor: `${primary[500]}0D`,
                },
            }}
        >
            {/* Linha 1: avatar + nome + badge de tipo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CoachAthleteAvatar
                    athlete={{ id: item.atletaId, name: item.athleteName }}
                    size="sm"
                    status="none"
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize:     '0.8rem',
                            fontWeight:   600,
                            color:        surface[50],
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                            lineHeight:   1.3,
                        }}
                    >
                        {item.athleteName}
                    </Typography>
                    <Box sx={{ mt: 0.25 }}>
                        <SuggestionTypeBadge type={toSuggestionType(item.tipo)} size="sm" />
                    </Box>
                </Box>
            </Box>

            {/* Linha 2: barra de confiança */}
            <ConfidenceBar
                value={toConfidenceValue(item.confidence)}
                size="sm"
                showLabel={false}
                showPercentage={true}
            />

            {/* Linha 3: resumo truncado */}
            <Typography
                sx={{
                    fontSize:        '0.75rem',
                    color:           surface[400],
                    display:         '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow:        'hidden',
                    lineHeight:      1.4,
                }}
            >
                {item.summary}
            </Typography>
        </Box>
    );
}

// ── Painel de revisão (coluna direita) ────────────────────────────────────────

function ReviewPanel({
    item,
    aprovando,
    rejeitando,
    onAprovar,
    onRejeitar,
}: {
    item: SugestaoCoachOutputDto;
    aprovando: boolean;
    rejeitando: boolean;
    onAprovar: () => void;
    onRejeitar: () => void;
}) {
    const [activeTab, setActiveTab] = useState(0);
    const busy = aprovando || rejeitando;
    const isPending = item.status === 'PENDING';

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {/* Cabeçalho */}
            <Box
                sx={{
                    px: 2.5, py: 2,
                    borderBottom: `1px solid ${content.divider}`,
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    flexShrink: 0,
                }}
            >
                <CoachAthleteAvatar
                    athlete={{ id: item.atletaId, name: item.athleteName }}
                    size="md"
                    status="none"
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                            sx={{ fontSize: '1.05rem', fontWeight: 700, color: surface[50], fontFamily: 'Syne, sans-serif' }}
                        >
                            {item.athleteName}
                        </Typography>
                        <SuggestionTypeBadge type={toSuggestionType(item.tipo)} size="md" />
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                        <ConfidenceBar
                            value={toConfidenceValue(item.confidence)}
                            size="sm"
                            showLabel={true}
                            showPercentage={true}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v: number) => setActiveTab(v)}
                    sx={{
                        minHeight: 40,
                        px: 2,
                        '& .MuiTab-root': {
                            minHeight: 40,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: surface[400],
                            textTransform: 'none',
                            px: 1.5,
                            py: 0,
                        },
                        '& .Mui-selected': { color: primary[500] },
                        '& .MuiTabs-indicator': { backgroundColor: primary[500] },
                    }}
                >
                    <Tab label="Detalhes" />
                    <Tab label="Raciocínio da IA" />
                </Tabs>
            </Box>

            {/* Conteúdo das tabs */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>
                {activeTab === 0 && (
                    <Box
                        sx={{
                            p: 2, borderRadius: '8px',
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
                            Resumo da sugestão
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: surface[100], lineHeight: 1.6 }}>
                            {item.summary}
                        </Typography>
                        <Typography sx={{ mt: 1.5, fontSize: '0.75rem', color: surface[500] }}>
                            Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </Typography>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box
                        sx={{
                            p: 2, borderRadius: '8px',
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
                            Raciocínio da IA
                        </Typography>
                        {item.reasoning?.rationale ? (
                            <Typography sx={{ fontSize: '0.9rem', color: surface[100], lineHeight: 1.7 }}>
                                {item.reasoning.rationale}
                            </Typography>
                        ) : (
                            <Typography sx={{ fontSize: '0.85rem', color: surface[500], fontStyle: 'italic' }}>
                                Raciocínio não disponível para esta sugestão.
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* Rodapé de ações */}
            <Box
                sx={{
                    px: 2.5, py: 2,
                    borderTop: `1px solid ${content.divider}`,
                    display: 'flex', gap: 1.5,
                    flexShrink: 0, flexWrap: 'wrap',
                }}
            >
                <Button
                    variant="contained"
                    onClick={onAprovar}
                    disabled={!isPending || busy}
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
                    {aprovando
                        ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                        : 'Aprovar'}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onRejeitar}
                    disabled={!isPending || busy}
                    sx={{
                        borderColor: semantic.danger[500],
                        color: semantic.danger[500],
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        px: 2.5,
                        minWidth: 100,
                        '&:hover': { borderColor: semantic.danger[300], backgroundColor: `${semantic.danger[500]}14` },
                        '&.Mui-disabled': { borderColor: surface[700], color: surface[500] },
                    }}
                >
                    {rejeitando
                        ? <CircularProgress size={14} sx={{ color: semantic.danger[500] }} />
                        : 'Rejeitar'}
                </Button>
            </Box>
        </Box>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1.5, px: 3,
            }}
        >
            <CheckCircleIcon sx={{ fontSize: 56, color: semantic.success[500] }} />
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: surface[50], fontFamily: 'Syne, sans-serif' }}>
                Tudo em dia!
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: surface[400], textAlign: 'center' }}>
                Nenhuma validação pendente — bom trabalho.
            </Typography>
        </Box>
    );
}

// ── Page principal ────────────────────────────────────────────────────────────

export default function CoachInboxPage() {
    const [allSugestoes, setAllSugestoes] = useState<SugestaoCoachOutputDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterOption>('PENDING');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [aprovandoIds, setAprovandoIds] = useState<Set<string>>(new Set());
    const [rejeitandoIds, setRejeitandoIds] = useState<Set<string>>(new Set());

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pending, approved, rejected] = await Promise.all([
                SugestaoService.listar('PENDING'),
                SugestaoService.listar('APPROVED'),
                SugestaoService.listar('REJECTED'),
            ]);
            setAllSugestoes([...pending, ...approved, ...rejected]);
        } catch {
            setError('Não foi possível carregar as sugestões.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Lista filtrada + seleção
    const filtered = activeFilter === 'all'
        ? allSugestoes
        : allSugestoes.filter((s) => s.status === activeFilter);

    // Mantém seleção válida ao mudar filtro
    useEffect(() => {
        if (filtered.length === 0) { setSelectedId(null); return; }
        if (!filtered.find((s) => s.id === selectedId)) {
            setSelectedId(filtered[0].id);
        }
    }, [filtered, selectedId]);

    const selected = filtered.find((s) => s.id === selectedId) ?? null;

    const handleAprovar = async () => {
        if (!selected) return;
        const id = selected.id;
        setAprovandoIds((prev) => new Set(prev).add(id));
        try {
            await SugestaoService.aprovar(id);
            await fetchAll();
        } finally {
            setAprovandoIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    const handleRejeitar = async () => {
        if (!selected) return;
        const id = selected.id;
        setRejeitandoIds((prev) => new Set(prev).add(id));
        try {
            await SugestaoService.rejeitar(id);
            await fetchAll();
        } finally {
            setRejeitandoIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography sx={{ color: semantic.danger[500], fontSize: '0.875rem' }}>{error}</Typography>
                <Button
                    variant="outlined" size="small" onClick={fetchAll}
                    sx={{ alignSelf: 'flex-start', borderColor: semantic.danger[500], color: semantic.danger[500] }}
                >
                    Tentar novamente
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden', bgcolor: elevation.base }}>
            {/* Coluna 1 — Filtros (~80px) */}
            <FilterColumn activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Coluna 2 — Lista de sugestões (~360px) */}
            <Box
                sx={{
                    width: 360, flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    borderRight: `1px solid ${content.divider}`,
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>
                    <Typography
                        sx={{
                            fontSize: '0.75rem', fontWeight: 600, color: surface[400],
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}
                    >
                        {filtered.length} {filtered.length === 1 ? 'sugestão' : 'sugestões'}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        flex: 1, overflowY: 'auto',
                        display: 'flex', flexDirection: 'column',
                        gap: 1, p: 1.5,
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
                    }}
                >
                    {filtered.length === 0 ? (
                        <Typography sx={{ fontSize: '0.8rem', color: surface[500], textAlign: 'center', mt: 4 }}>
                            Nenhuma sugestão encontrada.
                        </Typography>
                    ) : (
                        filtered.map((s) => (
                            <SuggestionCard
                                key={s.id}
                                item={s}
                                isSelected={s.id === selectedId}
                                onClick={() => setSelectedId(s.id)}
                            />
                        ))
                    )}
                </Box>
            </Box>

            {/* Coluna 3 — Painel de revisão (flex-1) */}
            {selected ? (
                <ReviewPanel
                    item={selected}
                    aprovando={aprovandoIds.has(selected.id)}
                    rejeitando={rejeitandoIds.has(selected.id)}
                    onAprovar={handleAprovar}
                    onRejeitar={handleRejeitar}
                />
            ) : (
                <EmptyState />
            )}
        </Box>
    );
}
