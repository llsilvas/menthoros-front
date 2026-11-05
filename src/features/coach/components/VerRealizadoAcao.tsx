import { useState } from 'react';
import { Button } from '@mui/material';
import { DirectionsRun as RunIcon } from '@mui/icons-material';
import { SECONDARY_OUTLINE_SX } from '../../../shared/components/actionButtonSx';
import type { AnaliseTreinoRealizadoState } from '../hooks/useAnaliseTreinoRealizado';
import type { PlanejadoComparavel } from '../types/ExecucaoTreino';
import { ExecucaoTreinoDialog } from './ExecucaoTreinoDialog';

interface VerRealizadoAcaoProps {
    treinoRealizadoId: string;
    planejado: PlanejadoComparavel;
    titulo: string;
    /** Estado da análise que o card já buscou (Planos); ausente, o dialog busca. */
    analise?: AnaliseTreinoRealizadoState;
}

/** Botão "Ver realizado" + o dialog de execução, iguais nos três cards de treino planejado. */
export function VerRealizadoAcao({ treinoRealizadoId, planejado, titulo, analise }: VerRealizadoAcaoProps) {
    const [aberto, setAberto] = useState(false);
    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<RunIcon />}
                onClick={(e) => {
                    // O card inteiro pode ser clicável (abre o editor); este botão não deve disparar isso.
                    e.stopPropagation();
                    setAberto(true);
                }}
                sx={{ ...SECONDARY_OUTLINE_SX, textTransform: 'none' }}
            >
                Ver realizado
            </Button>
            <ExecucaoTreinoDialog
                open={aberto}
                onClose={() => setAberto(false)}
                treinoRealizadoId={treinoRealizadoId}
                planejado={planejado}
                titulo={titulo}
                analise={analise}
            />
        </>
    );
}
