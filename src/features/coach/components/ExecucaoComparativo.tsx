import { Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import type { LinhaComparativo } from '../types/ExecucaoTreino';
import { BORDA, corDoTom, EYEBROW_SX, MONO } from './execucaoEstilos';

interface ExecucaoComparativoProps {
    linhas: LinhaComparativo[];
}

/** Planejado × realizado × diferença. A diferença sai em texto: a cor nunca é o único sinal. */
export function ExecucaoComparativo({ linhas }: ExecucaoComparativoProps) {
    const cel = { py: 1, px: 1.5, borderBottom: BORDA } as const;
    return (
        <Box sx={{ border: BORDA, borderRadius: 2, overflow: 'auto' }}>
            <Box component="table" aria-label="Planejado e realizado" sx={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        {['Métrica', 'Planejado', 'Realizado', 'Diferença'].map((h) => (
                            <Box component="th" key={h} scope="col" sx={{ ...cel, textAlign: 'left', bgcolor: surface[800], ...EYEBROW_SX }}>{h}</Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {linhas.map((l) => (
                        <tr key={l.rotulo}>
                            <Box component="th" scope="row" sx={{ ...cel, textAlign: 'left', fontWeight: 400, fontSize: '0.8125rem', color: surface[200] }}>{l.rotulo}</Box>
                            <Box component="td" sx={{ ...cel, fontFamily: MONO, fontSize: '0.875rem', color: surface[400] }}>{l.planejado}</Box>
                            <Box component="td" sx={{ ...cel, fontFamily: MONO, fontSize: '0.875rem', fontWeight: 700, color: surface[50] }}>{l.realizado}</Box>
                            <Box component="td" sx={cel}>
                                <Typography data-tom={l.tom} sx={{ fontFamily: MONO, fontSize: '0.75rem', fontWeight: 700, color: corDoTom(l.tom) }}>
                                    {l.diferenca}
                                </Typography>
                            </Box>
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    );
}
