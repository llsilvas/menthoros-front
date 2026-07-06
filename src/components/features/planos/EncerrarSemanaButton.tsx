import React, { useCallback, useState } from 'react';
import { Alert, Button } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useEncerrarSemana } from '../../../hooks/useEncerrarSemana';
import type { EncerramentoSemanaResult } from '../../../types/Encerramento';
import { EncerramentoSemanaResumo } from './EncerramentoSemanaResumo';

interface EncerrarSemanaButtonProps {
    planoId: string;
    /** Chamado após um encerramento bem-sucedido (ex.: recarregar os planos). */
    onEncerrado?: () => void;
    /** CTA "Gerar plano da próxima semana" (só quando o plano ficou concluído). */
    onGerarProximaSemana?: () => void;
}

/**
 * Botão "Encerrar semana" (ação on-demand do treinador) + resumo do resultado.
 * Delega a chamada ao hook `useEncerrarSemana`; renderiza loading/erro/resultado.
 */
export const EncerrarSemanaButton: React.FC<EncerrarSemanaButtonProps> = ({
    planoId,
    onEncerrado,
    onGerarProximaSemana,
}) => {
    const { encerrarSemana, loading, error } = useEncerrarSemana();
    const [resultado, setResultado] = useState<EncerramentoSemanaResult | null>(null);

    const handleClick = useCallback(async () => {
        try {
            const r = await encerrarSemana(planoId);
            setResultado(r);
            onEncerrado?.();
        } catch {
            // erro é o canal observável — ver {error && <Alert>} neste componente
        }
    }, [encerrarSemana, planoId, onEncerrado]);

    return (
        <>
            <Button
                size="small"
                variant="outlined"
                startIcon={<EventBusyIcon />}
                onClick={handleClick}
                disabled={loading}
            >
                Encerrar semana
            </Button>
            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    Não foi possível encerrar a semana. Tente novamente.
                </Alert>
            )}
            {resultado && (
                <EncerramentoSemanaResumo
                    resultado={resultado}
                    onGerarProximaSemana={resultado.prontoParaProximaSemana ? onGerarProximaSemana : undefined}
                />
            )}
        </>
    );
};
