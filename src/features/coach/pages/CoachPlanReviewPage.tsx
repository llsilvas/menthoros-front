import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useOutletContext } from 'react-router';
import { PlanoPendenteItem } from '../components/PlanoPendenteItem';
import { PlanoDetalhePanel } from '../components/PlanoDetalhePanel';
import { content, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

export default function CoachPlanReviewPage() {
    const {
        reviewPendentes: pendentes,
        reviewIsFetching: isFetching,
        reviewIsActing: isActing,
        reviewFetchError: fetchError,
        reviewActionError: actionError,
        reviewAprovar: aprovar,
        reviewRejeitar: rejeitar,
    } = useOutletContext<CoachLayoutOutletContext>();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    // Mantém seleção válida ao remover plano da lista
    useEffect(() => {
        if (!selectedId) return;
        if (!pendentes.find((p) => p.id === selectedId)) {
            setSelectedId(pendentes[0]?.id ?? null);
        }
    }, [pendentes, selectedId]);

    const selected = pendentes.find((p) => p.id === selectedId) ?? null;

    const handleAprovar = async () => {
        if (!selected) return;
        await aprovar(selected.id);
        setToast('Plano aprovado com sucesso');
    };

    const handleRejeitar = async (motivo: string) => {
        if (!selected) return;
        await rejeitar(selected.id, motivo);
        setToast('Plano rejeitado');
    };

    // ── Estados de loading e erro ──────────────────────────────────────────

    if (isFetching) {
        return (
            <Box
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
            >
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (fetchError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" variant="outlined">
                    {fetchError.message}
                </Alert>
            </Box>
        );
    }

    // ── Empty state global ─────────────────────────────────────────────────

    if (pendentes.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100%', gap: 1.5, px: 3,
                }}
            >
                <Typography
                    sx={{
                        fontSize: '1.25rem', fontWeight: 700, color: surface[50],
                        fontFamily: 'Syne, sans-serif',
                    }}
                >
                    Nenhum plano aguardando revisão
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: surface[400], textAlign: 'center' }}>
                    Os planos gerados pela IA aparecerão aqui para aprovação.
                </Typography>
            </Box>
        );
    }

    // ── Layout 2-colunas ───────────────────────────────────────────────────

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                bgcolor: elevation.base,
            }}
        >
            {/* Coluna esquerda — lista de pendentes */}
            <Box
                sx={{
                    width: 320,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: `1px solid ${content.divider}`,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        px: 2, py: 1.5,
                        borderBottom: `1px solid ${content.divider}`,
                        flexShrink: 0,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: '0.75rem', fontWeight: 600, color: surface[400],
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}
                    >
                        {pendentes.length} {pendentes.length === 1 ? 'plano pendente' : 'planos pendentes'}
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
                    {pendentes.map((plano) => (
                        <PlanoPendenteItem
                            key={plano.id}
                            plano={plano}
                            selecionado={plano.id === selectedId}
                            onSelect={() => setSelectedId(plano.id)}
                        />
                    ))}
                </Box>
            </Box>

            {/* Coluna direita — painel de detalhe */}
            <PlanoDetalhePanel
                plano={selected}
                isActing={isActing}
                onAprovar={handleAprovar}
                onRejeitar={handleRejeitar}
            />

            {/* Toast de confirmação de ação */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={() => setToast(null)}
                    sx={{ fontSize: '0.85rem' }}
                >
                    {toast}
                </Alert>
            </Snackbar>

            {/* Toast de erro de ação */}
            {actionError && (
                <Snackbar
                    open={!!actionError}
                    autoHideDuration={5000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity="error" variant="filled" sx={{ fontSize: '0.85rem' }}>
                        {actionError.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
}
