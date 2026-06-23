import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

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
    const confirmBg = severity === 'danger' ? 'error.main' : 'primary.main';
    const confirmHover = severity === 'danger' ? 'error.dark' : 'primary.dark';

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} size="small" disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    size="small"
                    disabled={loading}
                    sx={{ bgcolor: confirmBg, '&:hover': { bgcolor: confirmHover } }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
