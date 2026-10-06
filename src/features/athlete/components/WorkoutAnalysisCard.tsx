import { useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { primary, surface, aiHighlight, font, backgrounds } from '../../../theme/tokens';
import { radius } from '../../../shared/design-tokens/density';
import { Card } from '../../../shared/components/Card';
import { CardHeader } from '../../../shared/components/CardHeader';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

export interface WorkoutAnalysisCardProps {
    view: WorkoutAnalysisView;
    /**
     * Sem `Card`/`CardHeader` em volta — usado só pela Home (`TodayCompletedCard`), onde o
     * `WorkoutAnalysisCard` já mora dentro do card do treino (board do founder: sem card-em-card).
     * `WorkoutDetailDrawer` e `PostWorkoutFeedbackCard` continuam com o card completo, porque ali
     * não há um card de treino em volta.
     */
    embedded?: boolean;
}

/** Ícone de análise (sparkle) — SVG inline, sem emoji, escala e recolore com o tema. Exportado para o teaser da Home reusar o mesmo símbolo. */
export function SparkleIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={primary[500]}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
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
 * Card "Análise do treino" na visão do atleta (analise-ia-treino-atleta, refinado em
 * refine-athlete-workout-analysis-card): linha de métricas em mono → linha de plano (só se
 * divergir) → contêiner `ai-highlight` com só o `reconhecimento` (resumo) visível; comoFoi,
 * proximoTreino e esforco ficam atrás de "Ver análise completa" para o card fechado caber em
 * poucas linhas (ajuste pós-review, 2026-10-06 — decisão explícita do founder de recolher também
 * o proximoTreino, revertendo a decisão anterior de mantê-lo sempre visível). Presentacional:
 * recebe o view model pronto do adapter.
 */
export function WorkoutAnalysisCard({ view, embedded = false }: WorkoutAnalysisCardProps) {
    const pendente = view.status === 'pending';
    const [expandido, setExpandido] = useState(false);

    const corpo = (
        <>
            {view.metrics.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography
                        sx={{
                            fontFamily: font.mono,
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.8125rem',
                            lineHeight: '18px',
                            color: surface[300],
                        }}
                    >
                        {view.metrics.map((item, i) => (
                            <span key={item.key} style={{ color: item.color }}>
                                {i > 0 && ' · '}
                                {item.text}
                            </span>
                        ))}
                    </Typography>
                    {view.planLine && (
                        <Typography
                            variant="caption"
                            sx={{ fontFamily: font.mono, color: surface[400] }}
                        >
                            {view.planLine}
                        </Typography>
                    )}
                </Box>
            )}

            {pendente ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} role="status">
                    <Typography sx={{ fontSize: '0.8125rem', lineHeight: '18px', color: surface[400] }}>
                        Analisando o seu treino… pode fechar, fica guardado aqui.
                    </Typography>
                    <Skeleton variant="rounded" height={8} width="92%" sx={{ bgcolor: backgrounds.highest }} />
                    <Skeleton variant="rounded" height={8} width="64%" sx={{ bgcolor: backgrounds.highest }} />
                </Box>
            ) : (
                <>
                    <Box
                        data-testid="ai-highlight"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            pt: 1.5,
                            px: 2,
                            pb: 0.5,
                            borderRadius: radius.lg,
                            bgcolor: aiHighlight.bg,
                            border: `1px solid ${aiHighlight.border}`,
                        }}
                    >
                        {embedded && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <SparkleIcon size={12} />
                                <SectionLabel color={primary[500]}>Análise do treino</SectionLabel>
                            </Box>
                        )}

                        {view.reconhecimento && (
                            <Typography sx={{ color: surface[50], textWrap: 'pretty' }}>
                                {view.reconhecimento}
                            </Typography>
                        )}

                        {expandido && (
                            <Box id="workout-analysis-detalhes" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {view.comoFoi && (
                                    <Typography sx={{ fontSize: '0.8125rem', lineHeight: '18px', color: surface[300], textWrap: 'pretty' }}>
                                        {view.comoFoi}
                                    </Typography>
                                )}

                                {view.proximoTreino && (
                                    <Typography sx={{ fontSize: '0.8125rem', lineHeight: '18px', color: surface[300], textWrap: 'pretty' }}>
                                        {view.proximoTreino}
                                    </Typography>
                                )}

                                {view.esforco && (
                                    <Typography sx={{ fontSize: '0.8125rem', lineHeight: '18px', color: surface[300], textWrap: 'pretty' }}>
                                        {view.esforco}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {(view.comoFoi || view.proximoTreino || view.esforco) && (
                            <Button
                                size="small"
                                aria-expanded={expandido}
                                aria-controls="workout-analysis-detalhes"
                                onClick={() => setExpandido((v) => !v)}
                                sx={{
                                    alignSelf: 'flex-start',
                                    px: 0,
                                    py: 1.5,
                                    minWidth: 0,
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    color: primary[500],
                                }}
                            >
                                {expandido ? 'Ver menos' : 'Ver análise completa'}
                            </Button>
                        )}
                    </Box>

                    <Typography variant="caption" sx={{ color: surface[500], textWrap: 'pretty' }}>
                        Gerada automaticamente a partir do treino que você registrou. Seu coach vê a mesma análise.
                    </Typography>
                </>
            )}
        </>
    );

    if (embedded) {
        return (
            <Box data-testid="workout-analysis-card" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {corpo}
            </Box>
        );
    }

    return (
        <Card
            data-testid="workout-analysis-card"
            variant="flat"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <CardHeader icon={<SparkleIcon />} title="Análise do treino" />
            {corpo}
        </Card>
    );
}

export default WorkoutAnalysisCard;
