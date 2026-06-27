import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useRaceProjection } from '../../../hooks/useRaceProjection';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { SUCCESS_BTN_SX } from '../../../features/coach/components/actionButtonSx';
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
                sx={SUCCESS_BTN_SX}
            >
                {loading ? 'Marcando...' : 'Marcar como Oficial'}
            </Button>

            <ConfirmDialog
                open={confirmOpen}
                title="Marcar como Oficial?"
                message="Esta projeção será marcada como oficial e ficará visível ao atleta. A projeção oficial anterior (se houver) será substituída."
                confirmLabel="Confirmar"
                loading={loading}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
            />
        </>
    );
};

export default MarcarOficialButton;
