import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { primary, semantic, surface } from '../../theme/tokens';

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
    const isDanger = severity === 'danger';
    const confirmSx = isDanger
        ? { bgcolor: semantic.danger[500], color: surface[50], '&:hover': { bgcolor: semantic.danger[700] } }
        : { bgcolor: primary[500], color: surface[900], fontWeight: 700, '&:hover': { bgcolor: primary[600] } };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{title}</DialogTitle>
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
