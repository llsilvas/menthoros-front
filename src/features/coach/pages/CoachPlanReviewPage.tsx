import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useOutletContext } from 'react-router';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { PlanoPendenteItem } from '../components/PlanoPendenteItem';
import { PlanoDetalhePanel } from '../components/PlanoDetalhePanel';
import { TreinoEditDialog } from '../components/TreinoEditDialog';
import { TreinoAddDialog } from '../components/TreinoAddDialog';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { primary, surface, content, semantic } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';
import type { ReviewFilter } from '../../../hooks/useCoachPlanReview';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import type { TreinoPlanejadoPatch, TreinoPlanejadoDto } from '../../../types/PlanoReview';

// ── Coluna de filtros ────────────────────────────────────────────────────────

interface FilterChip { value: ReviewFilter; label: string }

const FILTER_CHIPS: FilterChip[] = [
    { value: 'AGUARDANDO_REVISAO', label: 'Aguardando' },
    { value: 'APROVADO',           label: 'Aprovados'  },
    { value: 'REJEITADO',          label: 'Rejeitados' },
    { value: 'all',                label: 'Todos'      },
];

function FilterColumn({
    activeFilter,
    onFilterChange,
}: {
    activeFilter: ReviewFilter;
    onFilterChange: (f: ReviewFilter) => void;
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

// ── Empty state labels por filtro ────────────────────────────────────────────

const EMPTY_LABEL: Record<ReviewFilter, string> = {
    AGUARDANDO_REVISAO: 'Nenhum plano aguardando revisão',
    APROVADO:           'Nenhum plano aprovado ainda',
    REJEITADO:          'Nenhum plano rejeitado',
    all:                'Nenhum plano encontrado',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPlanReviewPage() {
    const {
        reviewPendentes: pendentes,
        reviewIsFetching: isFetching,
        reviewIsActing: isActing,
        reviewFetchError: fetchError,
        reviewActionError: actionError,
        reviewActiveFilter: activeFilter,
        reviewSetFilter: setFilter,
        reviewAprovar: aprovar,
        reviewRejeitar: rejeitar,
        reviewFetchPendentes,
    } = useOutletContext<CoachLayoutOutletContext>();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
    const [editingTreinoId, setEditingTreinoId] = useState<string | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteTreinoId, setDeleteTreinoId] = useState<string | null>(null);

    const { isSaving: isEditSaving, isDeleting, editarTreino, excluirTreino } = useTreinoPlanejado();

    // Mantém seleção válida ao remover plano da lista ou mudar filtro
    useEffect(() => {
        if (!selectedId) return;
        if (!pendentes.find((p) => p.id === selectedId)) {
            setSelectedId(pendentes[0]?.id ?? null);
        }
    }, [pendentes, selectedId]);

    const selected = pendentes.find((p) => p.id === selectedId) ?? null;

    const editingTreino = editingTreinoId
        ? (selected?.treinosPlanejados?.find((t) => t.id === editingTreinoId) ?? null)
        : null;

    const handleAprovar = async () => {
        if (!selected) return;
        const ok = await aprovar(selected.id);
        if (ok) setToast({ msg: 'Plano aprovado com sucesso', severity: 'success' });
    };

    const handleRejeitar = async (motivo: string) => {
        if (!selected) return;
        const ok = await rejeitar(selected.id, motivo);
        if (ok) setToast({ msg: 'Plano rejeitado', severity: 'success' });
    };

    const handleAbrirEdicao = (treinoId: string) => {
        setEditingTreinoId(treinoId);
    };

    const handleTreinoAdicionado = async (treino: TreinoPlanejadoDto) => {
        setAddDialogOpen(false);
        await reviewFetchPendentes();
        setToast({ msg: `Treino ${treino.tipoTreino} adicionado com sucesso`, severity: 'success' });
    };

    const handleAbrirExclusao = (treinoId: string) => {
        setDeleteTreinoId(treinoId);
    };

    const handleCancelarExclusao = () => {
        if (isDeleting) return;
        setDeleteTreinoId(null);
    };

    const handleConfirmarExclusao = async () => {
        if (!selected || !deleteTreinoId) return;
        try {
            await excluirTreino(selected.id, deleteTreinoId);
            setDeleteTreinoId(null);
            await reviewFetchPendentes();
            setToast({ msg: 'Treino excluído com sucesso', severity: 'success' });
        } catch {
            setToast({ msg: 'Erro ao excluir treino. Tente novamente.', severity: 'error' });
        }
    };

    const handleSalvarEdicao = async (patch: TreinoPlanejadoPatch) => {
        if (!selected || !editingTreinoId) return;
        try {
            await editarTreino(selected.id, editingTreinoId, patch);
            setEditingTreinoId(null);
            await reviewFetchPendentes();
            setToast({ msg: 'Treino atualizado com sucesso', severity: 'success' });
        } catch {
            setToast({ msg: 'Erro ao salvar treino. Tente novamente.', severity: 'error' });
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────

    if (isFetching) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={32} thickness={2} sx={{ color: primary[500] }} />
            </Box>
        );
    }

    // ── Erro de fetch ──────────────────────────────────────────────────────────

    if (fetchError) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
                <Alert
                    severity="error"
                    variant="outlined"
                    sx={{
                        maxWidth: 440,
                        borderColor: `${semantic.danger[500]}50`,
                        '& .MuiAlert-message': { fontSize: '0.85rem' },
                    }}
                >
                    {fetchError.message}
                </Alert>
            </Box>
        );
    }

    // ── Layout principal ───────────────────────────────────────────────────────

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden', bgcolor: elevation.base }}>

            {/* Coluna 1 — Filtros (80px) */}
            <FilterColumn activeFilter={activeFilter} onFilterChange={setFilter} />

            {/* Coluna 2 — Fila de revisão (296px) */}
            <Box
                sx={{
                    width: 296,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: `1px solid ${content.divider}`,
                    overflow: 'hidden',
                    bgcolor: `${surface[0]}04`,
                }}
            >
                {/* Header da lista */}
                <Box sx={{ px: 2, py: 1.75, borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>
                    <Typography
                        sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: surface[500],
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            mb: 0.25,
                        }}
                    >
                        Fila de Revisão
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: surface[600] }}>
                        {pendentes.length} {pendentes.length === 1 ? 'plano' : 'planos'}
                    </Typography>
                </Box>

                {/* Lista ou empty state inline */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        p: 1.5,
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
                    }}
                >
                    {pendentes.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                gap: 1.5,
                                py: 4,
                                opacity: 0.6,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    bgcolor: `${primary[500]}10`,
                                    border: `1px solid ${primary[500]}28`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, color: primary[500] }} />
                            </Box>
                            <Typography sx={{ fontSize: '0.75rem', color: surface[500], textAlign: 'center', px: 1 }}>
                                {EMPTY_LABEL[activeFilter]}
                            </Typography>
                        </Box>
                    ) : (
                        pendentes.map((plano) => (
                            <PlanoPendenteItem
                                key={plano.id}
                                plano={plano}
                                selecionado={plano.id === selectedId}
                                onSelect={() => setSelectedId(plano.id)}
                            />
                        ))
                    )}
                </Box>
            </Box>

            {/* Coluna 3 — Painel de detalhe (flex-1) */}
            <PlanoDetalhePanel
                plano={selected}
                isActing={isActing || isDeleting}
                onAprovar={handleAprovar}
                onRejeitar={handleRejeitar}
                onEditarTreino={handleAbrirEdicao}
                onExcluirTreino={handleAbrirExclusao}
                onAdicionarTreino={() => setAddDialogOpen(true)}
            />

            {/* Dialog de edição de treino */}
            {editingTreino && (
                <TreinoEditDialog
                    open
                    treino={editingTreino}
                    isSaving={isEditSaving}
                    onClose={() => setEditingTreinoId(null)}
                    onSave={handleSalvarEdicao}
                />
            )}

            {/* Dialog de adição de treino */}
            {selected && (
                <TreinoAddDialog
                    open={addDialogOpen}
                    planoId={selected.id}
                    semanaInicio={selected.semanaInicio}
                    semanaFim={selected.semanaFim}
                    treinosExistentes={selected.treinosPlanejados ?? []}
                    onClose={() => setAddDialogOpen(false)}
                    onSaved={handleTreinoAdicionado}
                />
            )}

            <ConfirmDialog
                open={!!deleteTreinoId}
                title="Excluir treino"
                message="Tem certeza que deseja excluir este treino planejado? Essa ação não pode ser desfeita."
                confirmLabel="Excluir"
                severity="danger"
                loading={isDeleting}
                onClose={handleCancelarExclusao}
                onConfirm={handleConfirmarExclusao}
            />

            {/* Toasts */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3500}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={toast?.severity ?? 'success'}
                    variant="filled"
                    onClose={() => setToast(null)}
                    sx={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        ...(toast?.severity === 'success' && {
                            bgcolor: primary[500],
                            color: surface[900],
                            '& .MuiAlert-icon': { color: surface[900] },
                        }),
                    }}
                >
                    {toast?.msg}
                </Alert>
            </Snackbar>

            {actionError && (
                <Snackbar
                    open={!!actionError}
                    autoHideDuration={5000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity="error" variant="filled" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {actionError.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
}
