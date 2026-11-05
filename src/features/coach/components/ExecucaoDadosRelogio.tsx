import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { surface } from '../../../theme/tokens';
import type { GrupoDadosRelogio } from '../types/ExecucaoTreino';
import { BORDA, EYEBROW_SX, MONO } from './execucaoEstilos';

interface ExecucaoDadosRelogioProps {
    grupos: GrupoDadosRelogio[];
}

/** Acordeão fechado com os demais dados do relógio, agrupados. */
export function ExecucaoDadosRelogio({ grupos }: ExecucaoDadosRelogioProps) {
    return (
        <Accordion disableGutters sx={{ bgcolor: 'transparent', border: BORDA, borderRadius: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: surface[800] }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: surface[200] }}>Todos os dados do relógio</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ columnCount: { xs: 1, sm: 2, md: 4 }, columnGap: 3 }}>
                    {grupos.map((g) => (
                        <Box key={g.titulo} sx={{ breakInside: 'avoid', mb: 2.5 }}>
                            <Typography sx={{ ...EYEBROW_SX, pb: 0.5, mb: 1, borderBottom: BORDA }}>{g.titulo}</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {g.itens.map((i) => (
                                    <Box key={i.rotulo} sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontFamily: MONO, fontSize: '0.9375rem', fontWeight: 700, color: surface[50], lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                                            {i.valor}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.6875rem', color: surface[400] }}>{i.rotulo}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}
