import { Box, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { PRIMARY_CAUSE_LABEL } from '../../../types/AnaliseWorkout';
import { aiHighlight, primary, semantic, surface } from '../../../theme/tokens';
import type { AnaliseTreinoRealizadoState } from '../hooks/useAnaliseTreinoRealizado';
import { EYEBROW_SX, MONO } from './execucaoEstilos';

interface ExecucaoAnaliseBannerProps {
    analise: AnaliseTreinoRealizadoState;
}

function Nota({ texto }: { texto: string }) {
    return (
        <Box sx={{ px: 2, py: 1.5, borderRadius: 2, border: `1px dashed ${surface[600]}`, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: surface[400] }} />
            <Typography sx={{ fontSize: '0.8125rem', color: surface[400] }}>{texto}</Typography>
        </Box>
    );
}

/** Banner da análise da IA (CA5–CA7). Falha ou carregando não ocupam espaço: o resto da tela segue. */
export function ExecucaoAnaliseBanner({ analise }: ExecucaoAnaliseBannerProps) {
    if (analise.status === 'indisponivel') return <Nota texto="Análise da IA indisponível para este treino no momento" />;
    if (analise.status === 'semRpe') return <Nota texto="A análise da IA depende do RPE do atleta" />;
    if (analise.status !== 'pronta' || !analise.data) return null;

    const { primaryCause: causa, executionScore, summary, recommendation } = analise.data;
    const corCausa = causa === 'NORMAL' ? semantic.success[500] : semantic.warning[500];
    return (
        <Box
            data-testid="execucao-analise-banner"
            sx={{ p: 2, borderRadius: 2, border: `1px solid ${aiHighlight.border}`, bgcolor: aiHighlight.bg, display: 'flex', flexDirection: 'column', gap: 1.25 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, ...EYEBROW_SX, color: primary[500] }}>
                        <AutoAwesomeIcon sx={{ fontSize: 14 }} /> Análise da IA
                    </Box>
                    {causa && (
                        <Box sx={{ px: 1, height: 22, display: 'inline-flex', alignItems: 'center', borderRadius: '4px', border: `1px solid ${corCausa}`, fontSize: '0.75rem', fontWeight: 700, color: corCausa }}>
                            {PRIMARY_CAUSE_LABEL[causa]}
                        </Box>
                    )}
                </Box>
                {executionScore != null && (
                    <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>
                        Nota de execução{' '}
                        <Box component="span" sx={{ fontFamily: MONO, fontWeight: 700, color: surface[50] }}>{executionScore}/100</Box>
                    </Typography>
                )}
            </Box>
            {summary && <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.43, fontWeight: 600, color: surface[50] }}>{summary}</Typography>}
            {recommendation && (
                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.4, color: surface[200] }}>
                    <Box component="strong" sx={{ color: primary[500], fontWeight: 600 }}>Recomendação:</Box> {recommendation}
                </Typography>
            )}
        </Box>
    );
}
