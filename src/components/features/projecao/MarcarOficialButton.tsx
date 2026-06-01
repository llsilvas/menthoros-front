import React, { useState } from 'react';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useRaceProjection } from '../../../hooks/useRaceProjection';
import type { RaceProjectionSnapshot } from '../../../types/RaceProjection';

interface MarcarOficialButtonProps {
    atletaId: string;
    snapshotId: string;
    provaId: string;
    onSuccess?: (updated: RaceProjectionSnapshot) => void;
    fullWidth?: boolean;
}

const MarcarOficialButton: React.FC<MarcarOficialButtonProps> = ({
    atletaId,
    snapshotId,
    provaId,
    onSuccess,
    fullWidth,
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const { marcarOficial, loading } = useRaceProjection();

    const handleConfirm = async () => {
        setConfirmOpen(false);
        const result = await marcarOficial(atletaId, snapshotId, provaId);
        if (result && onSuccess) {
            onSuccess(result);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                size="small"
                fullWidth={fullWidth}
                disabled={loading}
                onClick={() => setConfirmOpen(true)}
                startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#1e8449' } }}
            >
                {loading ? 'Marcando...' : 'Marcar como Oficial'}
            </Button>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Marcar como Oficial?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Esta projeção será marcada como oficial e ficará visível ao atleta.
                        A projeção oficial anterior (se houver) será substituída.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} size="small">Cancelar</Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#1e8449' } }}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MarcarOficialButton;
