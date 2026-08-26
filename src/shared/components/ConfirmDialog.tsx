import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { surface } from '../../theme/tokens';
import { DANGER_BTN_SX, PRIMARY_BTN_SX } from './actionButtonSx';

type ConfirmSeverity = 'default' | 'danger';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: ConfirmSeverity;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    severity = 'default',
    loading = false,
    onClose,
    onConfirm,
}: ConfirmDialogProps) {
    // Papéis de botão vêm de `actionButtonSx`, não de cor inline. A reimplementação anterior tinha
    // divergido do canônico no hover (`primary[600]` aqui vs `primary[400]` lá) — dois botões
    // primários do mesmo produto reagindo diferente ao mouse.
    const confirmSx = severity === 'danger' ? DANGER_BTN_SX : PRIMARY_BTN_SX;

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontFamily: (t) => t.typography.h4.fontFamily, fontWeight: 800 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ color: surface[200] }}>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
                <Button onClick={onClose} size="small" disabled={loading} sx={{ color: surface[400] }}>
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    size="small"
                    disabled={loading}
                    sx={confirmSx}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
