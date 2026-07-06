import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { useEncerrarSemana } from '../../../hooks/useEncerrarSemana';
import type { EncerramentoLoteResult } from '../../../types/Encerramento';

interface EncerrarLoteDialogProps {
    open: boolean;
    onClose: () => void;
    /** Chamado após o encerramento em lote (ex.: recarregar o roster). */
    onEncerrado?: () => void;
}

/**
 * Dialog de confirmação do encerramento em lote da assessoria. Carrega o preview (dry-run)
 * obrigatoriamente antes de qualquer mutação; só encerra de fato após o aceite explícito.
 * Cancelar é no-op. Exibe o resumo consolidado (totais + falhas por atleta) ao final.
 */
export const EncerrarLoteDialog: React.FC<EncerrarLoteDialogProps> = ({ open, onClose, onEncerrado }) => {
    const { previewLote, encerrarLote, loading, error } = useEncerrarSemana();
    const [preview, setPreview] = useState<EncerramentoLoteResult | null>(null);
    const [resultado, setResultado] = useState<EncerramentoLoteResult | null>(null);

    useEffect(() => {
        if (open) {
            setPreview(null);
            setResultado(null);
            previewLote().then(setPreview).catch(() => { /* erro via `error` */ });
        }
    }, [open, previewLote]);

    const handleConfirmar = async () => {
        try {
            const r = await encerrarLote();
            setResultado(r);
            onEncerrado?.();
        } catch {
            // erro tratado via `error`
        }
    };

    const emResultado = resultado !== null;

    const actions = emResultado ? (
        <Button onClick={onClose}>Fechar</Button>
    ) : (
        <>
            <Button onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button
                variant="contained"
                color="warning"
                onClick={handleConfirmar}
                disabled={loading || !preview}
            >
                Confirmar encerramento
            </Button>
        </>
    );

    return (
        <CoachDialog
            open={open}
            onClose={onClose}
            title="Encerrar semana de todos"
            subtitle={emResultado ? 'Resumo do encerramento' : 'Confira o impacto antes de confirmar'}
            maxWidth="sm"
            disableClose={loading}
            actions={actions}
        >
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {emResultado || preview
                        ? 'Não foi possível encerrar em lote. Tente novamente.'
                        : 'Não foi possível carregar a projeção. Tente novamente.'}
                </Alert>
            )}

            {!emResultado && !loading && preview && (
                <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Serão marcados <b>{preview.treinosPerdidosTotal}</b> treino(s) como perdidos e fechadas{' '}
                        <b>{preview.planosConcluidos}</b> semana(s) de <b>{preview.atletasProcessados}</b> atleta(s).
                    </Typography>
                    {preview.atletasSemPlano > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {preview.atletasSemPlano} atleta(s) sem semana corrente serão ignorados.
                        </Typography>
                    )}
                </Box>
            )}

            {emResultado && resultado && (
                <Box>
                    <Alert severity="success" sx={{ mb: 1 }}>
                        {resultado.planosConcluidos} semana(s) encerrada(s); {resultado.treinosPerdidosTotal} treino(s)
                        marcado(s) como perdido.
                    </Alert>
                    {resultado.falhas.length > 0 && (
                        <>
                            <Typography variant="subtitle2" color="warning.main" sx={{ mt: 1 }}>
                                Falhas ({resultado.falhas.length}) — os demais foram encerrados:
                            </Typography>
                            <List dense>
                                {resultado.falhas.map((f) => (
                                    <ListItem key={f.atletaId} disableGutters>
                                        <ListItemText primary={f.atletaId} secondary={f.motivo} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                </Box>
            )}
        </CoachDialog>
    );
};
