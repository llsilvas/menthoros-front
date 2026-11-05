import { Box, Typography } from '@mui/material';
import { semantic, surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import type { ZonasExecucao } from '../types/ExecucaoTreino';
import { MINIMO_NO_ALVO_PCT } from '../adapters/treinoRealizadoDetalheAdapters';
import { EYEBROW_SX, MONO } from './execucaoEstilos';

interface ExecucaoZonasProps {
    zonas: ZonasExecucao | null;
}

type ChaveZona = keyof typeof activeTheme.zones;
const corDaZona = (zona: string) => activeTheme.zones[zona as ChaveZona]?.color ?? surface[500];

/** Faixa empilhada do tempo em zonas de FC com a zona alvo destacada (CA8, CA10). */
export function ExecucaoZonas({ zonas }: ExecucaoZonasProps) {
    if (!zonas) {
        return (
            <Box>
                <Typography sx={{ ...EYEBROW_SX, mb: 1 }}>Distribuição de zonas</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: surface[400] }}>Tempo em zonas indisponível para este treino</Typography>
            </Box>
        );
    }
    const noAlvo = zonas.percentualNoAlvo;
    const dentro = (zonas.fracaoNoAlvo ?? 0) * 100 >= MINIMO_NO_ALVO_PCT;
    const ordem = [...zonas.faixas].reverse();
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography sx={EYEBROW_SX}>Distribuição de zonas</Typography>
                {noAlvo != null && (
                    <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', fontWeight: 700, color: dentro ? semantic.success[500] : semantic.warning[500] }}>
                        {noAlvo}% no alvo
                    </Typography>
                )}
            </Box>
            <Box role="img" aria-label={ordem.map((f) => `${f.zona} ${f.percentual}%`).join(', ')} sx={{ display: 'flex', height: 32, borderRadius: 1.5, overflow: 'hidden' }}>
                {ordem.filter((f) => f.segundos > 0).map((f) => (
                    <Box
                        key={f.zona}
                        title={`${f.zona}: ${f.tempo}`}
                        sx={{
                            width: `${Math.max(f.percentual, 0.6)}%`,
                            bgcolor: corDaZona(f.zona),
                            boxShadow: f.alvo ? `inset 0 0 0 2px ${surface[50]}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {f.percentual >= 8 && (
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: surface[900] }}>{f.zona} {f.percentual}%</Typography>
                        )}
                    </Box>
                ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mt: 1 }}>
                {ordem.map((f) => (
                    <Typography
                        key={f.zona}
                        data-alvo={f.alvo || undefined}
                        sx={{
                            fontSize: '0.75rem',
                            color: surface[400],
                            py: 0.25,
                            ...(f.alvo ? { px: 1, borderRadius: '4px', border: `1px solid ${semantic.success[500]}` } : {}),
                        }}
                    >
                        <Box component="strong" sx={{ color: surface[100] }}>{f.zona}</Box> {f.limites} ·{' '}
                        <Box component="span" sx={{ fontFamily: MONO, color: surface[100] }}>{f.tempo}</Box>
                        {f.alvo && <Box component="span" sx={{ ml: 0.5, color: semantic.success[500], fontWeight: 700 }}>alvo</Box>}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}
