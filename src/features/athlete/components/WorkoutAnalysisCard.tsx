import { Box, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

export interface WorkoutAnalysisCardProps {
    view: WorkoutAnalysisView;
}

/** Ícone de análise (sparkle) — SVG inline, sem emoji, escala e recolore com o tema. */
function SparkleIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={primary[500]}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
        </svg>
    );
}

function TrophyIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary[500]}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
            <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
        </svg>
    );
}

function SectionLabel({ children, color = surface[400] }: { children: string; color?: string }) {
    return (
        <Typography variant="overline" sx={{ color, display: 'block', lineHeight: '14px' }}>
            {children}
        </Typography>
    );
}

/**
 * Card "Análise do treino" na visão do atleta (analise-ia-treino-atleta, canvas aprovado):
 * reconhecimento → números executado vs. plano → "Como foi" → "O que o seu esforço diz" →
 * "Para o próximo treino". Presentacional: recebe o view model pronto do adapter.
 */
export function WorkoutAnalysisCard({ view }: WorkoutAnalysisCardProps) {
    const pendente = view.status === 'pending';

    return (
        <Box
            data-testid="workout-analysis-card"
            sx={{
                bgcolor: elevation.card,
                border: `1px solid ${surface[700]}`,
                borderRadius: radius.lg,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <SparkleIcon />
                <Typography variant="h6" sx={{ flex: 1, color: surface[50] }}>
                    Análise do treino
                </Typography>
            </Box>

            {!pendente && view.reconhecimento && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                    <TrophyIcon />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: surface[50], textWrap: 'pretty' }}>
                        {view.reconhecimento}
                    </Typography>
                </Box>
            )}

            {view.stats.length > 0 && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${view.stats.length}, minmax(0, 1fr))`,
                        gap: 1.5,
                        py: 1.5,
                        borderTop: `1px solid ${surface[700]}`,
                        borderBottom: `1px solid ${surface[700]}`,
                    }}
                >
                    {view.stats.map((stat) => (
                        <Box key={stat.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <Typography variant="caption" sx={{ color: surface[500], textTransform: 'uppercase' }}>
                                {stat.label}
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{ fontVariantNumeric: 'tabular-nums', color: stat.valueColor ?? surface[50] }}
                            >
                                {stat.value}
                            </Typography>
                            {stat.sub && (
                                <Typography variant="caption" sx={{ color: surface[400] }}>
                                    {stat.sub}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            )}

            {pendente ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: surface[400] }}>
                        Analisando o seu treino…
                    </Typography>
                    <Skeleton variant="rounded" height={10} width="92%" sx={{ bgcolor: surface[700] }} />
                    <Skeleton variant="rounded" height={10} width="78%" sx={{ bgcolor: surface[700] }} />
                    <Skeleton variant="rounded" height={10} width="60%" sx={{ bgcolor: surface[700] }} />
                    <Typography variant="caption" sx={{ color: surface[500], textWrap: 'pretty' }}>
                        Leva em torno de um minuto. Pode fechar — a análise fica guardada aqui no treino.
                    </Typography>
                </Box>
            ) : (
                <>
                    {view.comoFoi && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <SectionLabel>Como foi</SectionLabel>
                            <Typography variant="body1" sx={{ color: surface[300], textWrap: 'pretty' }}>
                                {view.comoFoi}
                            </Typography>
                        </Box>
                    )}

                    {view.esforco && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <SectionLabel>O que o seu esforço diz</SectionLabel>
                            <Typography variant="body1" sx={{ color: surface[300], textWrap: 'pretty' }}>
                                {view.esforco}
                            </Typography>
                        </Box>
                    )}

                    {view.proximoTreino && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.75,
                                p: 1.5,
                                borderRadius: radius.md,
                                bgcolor: alpha(primary[500], 0.08),
                            }}
                        >
                            <SectionLabel color={primary[500]}>Para o próximo treino</SectionLabel>
                            <Typography variant="body1" sx={{ color: surface[50], textWrap: 'pretty' }}>
                                {view.proximoTreino}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="caption" sx={{ color: surface[500], textWrap: 'pretty' }}>
                        Gerada automaticamente a partir do treino que você registrou. Seu coach vê a mesma análise.
                    </Typography>
                </>
            )}
        </Box>
    );
}

export default WorkoutAnalysisCard;
