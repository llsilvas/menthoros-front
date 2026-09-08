import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Collapse,
    LinearProgress,
    Link,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { useBatchPlanGeneration } from '../../../hooks/useBatchPlanGeneration';
import { usePlanGenerationActions, useJobProgress } from '../../../features/coach/context/planGenerationContext';
import { BatchPlanService } from '../../../api/services/BatchPlanService';
import { isBatchJobTerminal, type ModoGeracaoPlano } from '../../../types/BatchPlanJob';

interface BatchPlanDialogProps {
    open: boolean;
    onClose: () => void;
    /** Atletas selecionados no grid (deduplicados no backend). */
    atletaIds: string[];
    /** Resolve o nome do atleta a partir do id (para exibir na lista/erros). */
    resolveNomeAtleta?: (atletaId: string) => string;
    /** Chamado quando o lote conclui (ex.: limpar seleção, invalidar badge de pendentes). */
    onConcluido?: () => void;
}

const MODOS: { value: ModoGeracaoPlano; label: string }[] = [
    { value: 'PROXIMA_SEMANA', label: 'Próxima semana' },
    { value: 'SEMANA_ATUAL', label: 'Semana atual' },
];

/**
 * Dialog de geração de planos em lote: confirmação → progresso (polling) → resultado.
 * Os planos entram em Aguardando Revisão; o coach aprova cada um depois.
 */
export const BatchPlanDialog: React.FC<BatchPlanDialogProps> = ({
    open,
    onClose,
    atletaIds,
    resolveNomeAtleta,
    onConcluido,
}) => {
    // Legado (sem provider): estado local do hook. Com provider: o acompanhamento é do
    // PlanGenerationStore (um só poller), e cada atleta do lote reflete na SUA linha do roster —
    // o coach pode FECHAR o dialog e ver o progresso nas linhas (change plano-em-geracao-no-roster).
    const local = useBatchPlanGeneration();
    const { iniciarLote, anexarJobLote, liberarLote, getEntry, hasProvider } = usePlanGenerationActions();

    // jobId de um lote já em andamento que cobre a seleção atual (para reidratar ao reabrir o dialog
    // e não re-POSTar atletas que já estão gerando).
    const jobIdEmCurso = useCallback((): string | null => {
        for (const id of atletaIds) {
            const e = getEntry(id);
            if (e && e.status === 'gerando' && e.jobId) return e.jobId;
        }
        return null;
    }, [atletaIds, getEntry]);
    const [provJobId, setProvJobId] = useState<string | null>(null);
    const [provDisparando, setProvDisparando] = useState(false);
    const [provErro, setProvErro] = useState<string | null>(null);
    const provStatus = useJobProgress(provJobId);

    const [modo, setModo] = useState<ModoGeracaoPlano>('PROXIMA_SEMANA');
    const [mostrarErros, setMostrarErros] = useState(false);
    const onConcluidoRef = useRef(onConcluido);
    onConcluidoRef.current = onConcluido;
    const notificadoJobRef = useRef<string | null>(null);

    // Fonte única por caminho.
    const jobId = hasProvider ? provJobId : local.jobId;
    const status = hasProvider ? provStatus : local.status;
    const error = hasProvider ? provErro : local.error;
    const terminal = status ? isBatchJobTerminal(status.status) : false;
    const loading = hasProvider ? provDisparando || (!!provJobId && !terminal) : local.loading;
    const emConfirmacao = jobId === null && !loading;

    const total = status?.totalAtletas ?? atletaIds.length;

    // Reinicia o estado ao abrir; para o polling ao fechar (o dialog não desmonta).
    useEffect(() => {
        if (open) {
            local.reset();
            setModo('PROXIMA_SEMANA');
            setMostrarErros(false);
            setProvDisparando(false);
            setProvErro(null);
            // Reabrir durante um lote em andamento mostra o PROGRESSO (não a confirmação): reidrata o
            // jobId em curso a partir do store, em vez de sempre zerar.
            setProvJobId(hasProvider ? jobIdEmCurso() : null);
            notificadoJobRef.current = null;
        } else {
            local.reset();
        }
        // `local.reset` é estável (useCallback no hook); demais setters são estáveis.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Notifica a conclusão uma única vez por job.
    useEffect(() => {
        if (terminal && status && notificadoJobRef.current !== status.jobId) {
            notificadoJobRef.current = status.jobId;
            onConcluidoRef.current?.();
        }
    }, [terminal, status]);

    const handleConfirmar = useCallback(async () => {
        if (hasProvider) {
            setProvErro(null);
            const reservados = iniciarLote(atletaIds);
            if (reservados.length === 0) {
                // Todos os selecionados já estão em um lote em andamento — não re-POSTa; só mostra o
                // progresso do job existente (evita job duplicado no backend, que não deduplica entre
                // requisições).
                setProvJobId(jobIdEmCurso());
                return;
            }
            setProvDisparando(true);
            try {
                // POST só dos reservados (os que ainda não estavam gerando).
                const aceito = await BatchPlanService.gerarEmLote(reservados, modo);
                setProvJobId(aceito.jobId);
                anexarJobLote(reservados, aceito.jobId);
            } catch {
                liberarLote(reservados);
                setProvErro('Não foi possível iniciar a geração em lote.');
            } finally {
                setProvDisparando(false);
            }
            return;
        }
        try {
            await local.gerarLote(atletaIds, modo);
        } catch {
            // erro é o canal observável (Alert abaixo)
        }
    }, [hasProvider, iniciarLote, anexarJobLote, liberarLote, jobIdEmCurso, local, atletaIds, modo]);

    const progresso = useMemo(() => {
        if (!status || status.totalAtletas === 0) return 0;
        return Math.round(((status.gerados + status.erros) / status.totalAtletas) * 100);
    }, [status]);

    const actions = terminal ? (
        <Button onClick={onClose}>Fechar</Button>
    ) : emConfirmacao ? (
        <>
            <Button onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmar}
                disabled={loading || atletaIds.length === 0}
            >
                Gerar {atletaIds.length} plano(s)
            </Button>
        </>
    ) : (
        // Com provider o coach fecha durante a geração e acompanha pelas linhas do roster; sem
        // provider o polling vive no dialog, então "Fechar" segue bloqueado enquanto gera.
        <Button onClick={onClose} disabled={!hasProvider && loading}>Fechar</Button>
    );

    return (
        <CoachDialog
            open={open}
            onClose={onClose}
            title="Gerar planos em lote"
            subtitle={terminal ? 'Resultado da geração' : emConfirmacao ? 'Confirme os atletas do lote' : 'Gerando planos…'}
            maxWidth="sm"
            // Com provider o coach pode fechar durante a geração — o progresso segue nas linhas do
            // roster. Sem provider, mantém o bloqueio (o polling vive no dialog).
            disableClose={!hasProvider && loading && !terminal}
            actions={actions}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>
            )}

            {emConfirmacao && !error && (
                <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Serão gerados planos para <b>{atletaIds.length}</b> atleta(s) selecionado(s).
                    </Typography>
                    <TextField
                        select
                        size="small"
                        label="Modo de geração"
                        value={modo}
                        onChange={(e) => setModo(e.target.value as ModoGeracaoPlano)}
                        sx={{ mb: 2, minWidth: 200 }}
                    >
                        {MODOS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                        ))}
                    </TextField>
                    <Alert severity="info">
                        Os planos entrarão em <b>Aguardando Revisão</b> — você precisará aprovar cada um.
                    </Alert>
                </Box>
            )}

            {!emConfirmacao && !terminal && !error && (
                <Box>
                    <LinearProgress variant="determinate" value={progresso} sx={{ mb: 1, borderRadius: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {status ? status.gerados + status.erros : 0} de {total} processado(s)
                        {status && status.erros > 0 ? ` (${status.erros} com erro)` : ''}
                    </Typography>
                    {hasProvider && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Você pode fechar — o progresso de cada atleta aparece na linha dele no roster.
                        </Typography>
                    )}
                </Box>
            )}

            {terminal && status && (
                <Box>
                    <Alert severity={status.erros > 0 ? 'warning' : 'success'} sx={{ mb: 1 }}>
                        {status.gerados} plano(s) gerado(s)
                        {status.erros > 0 ? `; ${status.erros} com erro` : ''}.
                    </Alert>
                    {status.errosDetalhes.length > 0 && (
                        <>
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={() => setMostrarErros((v) => !v)}
                            >
                                {mostrarErros ? 'Ocultar' : 'Ver'} detalhes dos erros ({status.errosDetalhes.length})
                            </Link>
                            <Collapse in={mostrarErros} unmountOnExit>
                                <List dense>
                                    {status.errosDetalhes.map((e) => (
                                        <ListItem key={e.atletaId} disableGutters>
                                            <ListItemText
                                                primary={resolveNomeAtleta?.(e.atletaId) ?? e.atletaId}
                                                secondary={e.motivo}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </>
                    )}
                </Box>
            )}
        </CoachDialog>
    );
};
