import { Box, Typography, LinearProgress, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AderenciasSemanalDto } from '../../../types/AtletaPerfilCoach';
import { surface, semantic } from '../../../theme/tokens';

interface AdherenceChartProps {
    semanas: AderenciasSemanalDto[];
}

function barColor(percentual: number): string {
    if (percentual >= 80) return semantic.success[500];
    if (percentual >= 50) return semantic.warning[400];
    return semantic.danger[500];
}

export function AdherenceChart({ semanas }: AdherenceChartProps) {
    if (semanas.length === 0) {
        return (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Sem dados de aderência — registre treinos para ativar este bloco
                </Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={1}>
            {semanas.map((s) => {
                const label = format(parseISO(s.semanaInicio), "dd/MM", { locale: ptBR });
                const color = barColor(s.percentual);
                return (
                    <Box key={s.semanaInicio}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                {label}
                            </Typography>
                            <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                                {s.percentual}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(s.percentual, 100)}
                            aria-label={`Aderência semana ${label}: ${s.percentual}%`}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: surface[700],
                                '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 },
                            }}
                        />
                    </Box>
                );
            })}
        </Stack>
    );
}
