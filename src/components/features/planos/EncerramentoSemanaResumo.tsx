import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import type { EncerramentoSemanaResult } from '../../../types/Encerramento';

interface EncerramentoSemanaResumoProps {
    resultado: EncerramentoSemanaResult;
    /** Callback do CTA "Gerar plano da próxima semana" — só exibido quando o plano ficou concluído. */
    onGerarProximaSemana?: () => void;
}

/**
 * Resumo do encerramento da semana de um plano. Estado visual distinto:
 * - concluído (`prontoParaProximaSemana`) → verde (success) + CTA para gerar a próxima;
 * - meio da semana → amarelo (warning) com o `aviso` em destaque.
 */
export const EncerramentoSemanaResumo: React.FC<EncerramentoSemanaResumoProps> = ({
    resultado,
    onGerarProximaSemana,
}) => {
    const { treinosFinalizados, prontoParaProximaSemana, aviso } = resultado;

    if (prontoParaProximaSemana) {
        return (
            <Alert severity="success" sx={{ mt: 1 }} data-testid="encerramento-resumo-concluido">
                <AlertTitle>Semana encerrada</AlertTitle>
                {treinosFinalizados > 0
                    ? `${treinosFinalizados} treino(s) marcado(s) como perdido. Semana concluída.`
                    : 'Semana concluída.'}
                {onGerarProximaSemana && (
                    <Box sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={onGerarProximaSemana}
                        >
                            Gerar plano da próxima semana
                        </Button>
                    </Box>
                )}
            </Alert>
        );
    }

    return (
        <Alert severity="warning" sx={{ mt: 1 }} data-testid="encerramento-resumo-parcial">
            <AlertTitle>Semana ainda não encerrada</AlertTitle>
            {treinosFinalizados > 0
                ? `${treinosFinalizados} treino(s) passado(s) marcado(s) como perdido. `
                : ''}
            {aviso ?? 'Há treinos futuros pendentes nesta semana.'}
        </Alert>
    );
};
