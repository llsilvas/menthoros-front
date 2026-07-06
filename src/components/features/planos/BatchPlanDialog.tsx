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
    const { jobId, status, loading, error, gerarLote, reset } = useBatchPlanGeneration();
    const [modo, setModo] = useState<ModoGeracaoPlano>('PROXIMA_SEMANA');
    const [mostrarErros, setMostrarErros] = useState(false);
    // Guarda a referência mais recente de onConcluido sem re-disparar o efeito de conclusão.
    const onConcluidoRef = useRef(onConcluido);
    onConcluidoRef.current = onConcluido;
    // Garante que onConcluido dispara uma única vez por job (não em loop de re-render).
    const notificadoJobRef = useRef<string | null>(null);

    const total = status?.totalAtletas ?? atletaIds.length;
    const terminal = status ? isBatchJobTerminal(status.status) : false;
    const emConfirmacao = jobId === null;

    // Reinicia o estado ao abrir; para o polling ao fechar (o dialog não desmonta).
    useEffect(() => {
        if (open) {
            reset();
            setModo('PROXIMA_SEMANA');
            setMostrarErros(false);
            notificadoJobRef.current = null;
        } else {
            reset();
        }
    }, [open, reset]);

    // Notifica a conclusão uma única vez por job.
    useEffect(() => {
        if (terminal && status && notificadoJobRef.current !== status.jobId) {
            notificadoJobRef.current = status.jobId;
            onConcluidoRef.current?.();
        }
    }, [terminal, status]);

    const handleConfirmar = useCallback(async () => {
        try {
            await gerarLote(atletaIds, modo);
        } catch {
            // erro é o canal observável (Alert abaixo)
        }
    }, [gerarLote, atletaIds, modo]);

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
        <Button onClick={onClose} disabled={loading}>Fechar</Button>
    );

    return (
        <CoachDialog
            open={open}
            onClose={onClose}
            title="Gerar planos em lote"
            subtitle={terminal ? 'Resultado da geração' : emConfirmacao ? 'Confirme os atletas do lote' : 'Gerando planos…'}
            maxWidth="sm"
            disableClose={loading && !terminal}
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
