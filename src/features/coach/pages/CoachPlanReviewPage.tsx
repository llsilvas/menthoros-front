import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useOutletContext } from 'react-router';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { PlanoPendenteItem } from '../components/PlanoPendenteItem';
import { PlanoDetalhePanel } from '../components/PlanoDetalhePanel';
import { primary, surface, content, semantic } from '../../../theme/tokens';
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
    const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

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
        setToast({ msg: 'Plano aprovado com sucesso', severity: 'success' });
    };

    const handleRejeitar = async (motivo: string) => {
        if (!selected) return;
        await rejeitar(selected.id, motivo);
        setToast({ msg: 'Plano rejeitado', severity: 'success' });
    };

    // ── Loading ────────────────────────────────────────────────────────────────

    if (isFetching) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress
                    size={32}
                    thickness={2}
                    sx={{ color: primary[500] }}
                />
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

    // ── Empty state ────────────────────────────────────────────────────────────

    if (pendentes.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 2,
                    px: 4,
                }}
            >
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: `${primary[500]}10`,
                        border: `1px solid ${primary[500]}28`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AutoAwesomeOutlinedIcon sx={{ fontSize: 24, color: primary[500], opacity: 0.7 }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        sx={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: surface[300],
                            mb: 0.75,
                        }}
                    >
                        Nenhum plano aguardando revisão
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: surface[500], maxWidth: 300 }}>
                        Quando a IA gerar novos planos para seus atletas, eles aparecerão aqui para aprovação.
                    </Typography>
                </Box>
            </Box>
        );
    }

    // ── Layout principal ───────────────────────────────────────────────────────

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
            {/* ── Coluna esquerda: fila de revisão ───────────────────── */}
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
                <Box
                    sx={{
                        px: 2,
                        py: 1.75,
                        borderBottom: `1px solid ${content.divider}`,
                        flexShrink: 0,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'Syne, sans-serif',
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
                        {pendentes.length} {pendentes.length === 1 ? 'plano pendente' : 'planos pendentes'}
                    </Typography>
                </Box>

                {/* Lista */}
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

            {/* ── Coluna direita: painel de detalhe ──────────────────── */}
            <PlanoDetalhePanel
                plano={selected}
                isActing={isActing}
                onAprovar={handleAprovar}
                onRejeitar={handleRejeitar}
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
                    <Alert
                        severity="error"
                        variant="filled"
                        sx={{ fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        {actionError.message}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
}
