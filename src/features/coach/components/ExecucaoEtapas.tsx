import { Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';
import type { LinhaEtapa } from '../types/ExecucaoTreino';
import { BORDA, EYEBROW_SX, MONO } from './execucaoEstilos';

interface ExecucaoEtapasProps {
    etapas: LinhaEtapa[];
    total: LinhaEtapa | null;
}

const COLUNAS: { chave: keyof LinhaEtapa; rotulo: string }[] = [
    { chave: 'rotulo', rotulo: 'Etapa' },
    { chave: 'tempo', rotulo: 'Tempo' },
    { chave: 'distancia', rotulo: 'Dist.' },
    { chave: 'ritmo', rotulo: 'Ritmo' },
    { chave: 'fcMedia', rotulo: 'FC méd.' },
    { chave: 'fcMax', rotulo: 'FC máx.' },
    { chave: 'cadencia', rotulo: 'Cadência' },
    { chave: 'potencia', rotulo: 'Potência' },
    { chave: 'elevacao', rotulo: 'Elevação' },
];

/** Voltas em largura total, cabeçalho fixo e rolagem; linha Total com os valores da sessão (CA11). */
export function ExecucaoEtapas({ etapas, total }: ExecucaoEtapasProps) {
    const cel = { px: 1, py: 0.75, fontFamily: MONO, fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right', borderBottom: BORDA } as const;
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography sx={EYEBROW_SX}>Etapas</Typography>
                {etapas.length > 0 && <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>{etapas.length} voltas</Typography>}
            </Box>
            {etapas.length === 0 ? (
                <Typography sx={{ fontSize: '0.8125rem', color: surface[400] }}>Sem voltas registradas para este treino</Typography>
            ) : (
                // Região rolável focável: sem foco, quem navega por teclado não alcança voltas e colunas escondidas.
                <Box role="region" aria-label="Voltas do treino" tabIndex={0} sx={{ overflow: 'auto', maxHeight: 360, border: BORDA, borderRadius: 1 }}>
                    <Box component="table" aria-label="Voltas do treino" sx={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                        <thead>
                            <tr>
                                {COLUNAS.map((c) => (
                                    <Box component="th" key={c.chave} scope="col" sx={{ ...cel, fontFamily: 'inherit', color: surface[400], fontWeight: 600, position: 'sticky', top: 0, bgcolor: surface[800] }}>
                                        {c.rotulo}
                                    </Box>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {etapas.map((e) => (
                                <tr key={e.rotulo}>
                                    {COLUNAS.map((c) => <Box component="td" key={c.chave} sx={{ ...cel, color: surface[100] }}>{e[c.chave]}</Box>)}
                                </tr>
                            ))}
                            {total && (
                                <tr data-testid="execucao-etapas-total">
                                    {COLUNAS.map((c) => <Box component="td" key={c.chave} sx={{ ...cel, color: surface[50], fontWeight: 700 }}>{total[c.chave]}</Box>)}
                                </tr>
                            )}
                        </tbody>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
