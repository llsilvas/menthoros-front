import { useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { primary, surface, aiHighlight, font } from '../../../theme/tokens';
import { radius } from '../../../shared/design-tokens/density';
import { Card } from '../../../shared/components/Card';
import { CardHeader } from '../../../shared/components/CardHeader';
import type { WorkoutAnalysisView } from '../adapters/buildWorkoutAnalysisView';

export interface WorkoutAnalysisCardProps {
    view: WorkoutAnalysisView;
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
    const [expandido, setExpandido] = useState(false);

    return (
        <Card
            data-testid="workout-analysis-card"
            variant="flat"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <CardHeader icon={<SparkleIcon />} title="Análise do treino" />

            {view.metrics.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography
                        variant="h6"
                        sx={{ fontFamily: font.mono, fontVariantNumeric: 'tabular-nums', color: surface[50] }}
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: surface[400] }}>
                        Analisando o seu treino… pode fechar, fica guardado aqui.
                    </Typography>
                    <Skeleton variant="rounded" height={10} width="92%" sx={{ bgcolor: surface[700] }} />
                    <Skeleton variant="rounded" height={10} width="70%" sx={{ bgcolor: surface[700] }} />
                </Box>
            ) : (
                <>
                    <Box
                        data-testid="ai-highlight"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            p: 1.5,
                            borderRadius: radius.md,
                            bgcolor: aiHighlight.bg,
                            border: `1px solid ${aiHighlight.border}`,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <TrophyIcon />
                            <SectionLabel color={primary[500]}>Análise da IA</SectionLabel>
                        </Box>

                        {view.reconhecimento && (
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: surface[50], textWrap: 'pretty' }}>
                                {view.reconhecimento}
                            </Typography>
                        )}

                        {view.comoFoi && (
                            <Typography variant="body1" sx={{ color: surface[300], textWrap: 'pretty' }}>
                                {view.comoFoi}
                            </Typography>
                        )}

                        {view.proximoTreino && (
                            <Typography variant="body1" sx={{ color: surface[300], textWrap: 'pretty' }}>
                                {view.proximoTreino}
                            </Typography>
                        )}

                        {expandido && view.esforco && (
                            <Typography variant="body1" sx={{ color: surface[300], textWrap: 'pretty' }}>
                                {view.esforco}
                            </Typography>
                        )}

                        {view.esforco && (
                            <Button
                                size="small"
                                aria-expanded={expandido}
                                onClick={() => setExpandido((v) => !v)}
                                sx={{ alignSelf: 'flex-start', px: 0, minHeight: 32, color: primary[500] }}
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
        </Card>
    );
}

export default WorkoutAnalysisCard;
