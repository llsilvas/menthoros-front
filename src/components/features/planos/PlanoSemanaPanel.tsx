import type { ComponentProps } from 'react';
import { Box, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { Card } from '../../../shared/components/Card';
import { KpiStrip } from '../../../features/coach/components/KpiStrip';
import type { PlanoSemanal, PlanoStatus } from '../../../types/PlanoSemanal';
import { calcularProgressoVolume, obterStatusColor, obterStatusLabel } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { getSafeNumber, getSafeValue } from '../../../utils/safeValues';
import { backgrounds, content, semantic, surface } from '../../../theme/tokens';
import { activeTheme } from '../../../theme/activeTheme';
import TreinoCard from './TreinoCard';
import { EncerrarSemanaButton } from './EncerrarSemanaButton';
import {
    calcularVolumeRealizado,
    formatarKm,
    formatarPeriodo,
    isTreinoRealizado,
    ordenarPorDiaSemana,
} from './planoSemanaUtils';

const EYEBROW_SX = {
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: surface[400],
} as const;

const GUTTER_X = { xs: 1.5, md: 2 } as const;

interface PlanoSemanaPanelProps {
    plano: PlanoSemanal;
    /** Geração de plano em andamento — repassada ao CTA "gerar próxima semana" do encerramento. */
    gerando: boolean;
    onEncerrado: () => void;
    onGerarProximaSemana: () => void;
    onDetalhes: (treino: TreinoPlanejado) => void;
    onMarcarRealizado: (treino: TreinoPlanejado, planoSemanalId: string) => void;
    onMarcarPerdido: (treinoId: string) => void;
    /** Plano salvo o RPE: a lista precisa recarregar, senão o card volta a mostrar o valor antigo
     * ao trocar de aba/semana e voltar (o RPE só fica no estado local do card). */
    onRpeSalvo: () => void;
}

/**
 * Estado por cor E por texto: o chip leva o rótulo do status, não só o tom. O neutro (PLANEJADO)
 * usa surface[200] no texto — surface[500] não passa contraste sobre o fundo escuro.
 */
function PlanoStatusChip({ status }: { status: PlanoStatus }) {
    const color = obterStatusColor(status);
    const textColor = status === 'PLANEJADO' ? surface[200] : color;
    return (
        <Chip
            label={obterStatusLabel(status)}
            size="small"
            sx={{ color: textColor, bgcolor: `${color}1F`, border: `1px solid ${color}4D`, fontWeight: 700 }}
        />
    );
}

function TextBlock({ label, text }: { label: string; text: string }) {
    return (
        <Box sx={{ bgcolor: backgrounds.panel, px: GUTTER_X, py: 1.5 }}>
            <Typography sx={EYEBROW_SX}>{label}</Typography>
            <Typography sx={{ mt: 0.5, fontSize: '0.875rem', lineHeight: 1.5, color: surface[200], textWrap: 'pretty' }}>
                {text}
            </Typography>
        </Box>
    );
}

export function PlanoSemanaPanel({
    plano,
    gerando,
    onEncerrado,
    onGerarProximaSemana,
    onDetalhes,
    onMarcarRealizado,
    onMarcarPerdido,
    onRpeSalvo,
}: PlanoSemanaPanelProps) {
    const treinos = plano.treinosPlanejados ?? [];
    const status = getSafeValue(plano.status) as PlanoStatus;
    const periodo = formatarPeriodo(
        getSafeValue(plano.semanaInicio) as string,
        getSafeValue(plano.semanaFim) as string,
    );

    const volumePlanejado = getSafeNumber(plano.volumePlanejadoKm);
    const volumeAlvo = getSafeNumber(plano.volumeAlvoKm);
    const volumeRealizado = calcularVolumeRealizado(treinos);
    const treinosRealizados = treinos.filter(isTreinoRealizado).length;
    const progresso = calcularProgressoVolume(volumeRealizado, volumePlanejado);

    const objetivo = plano.objetivoSemanal ? String(getSafeValue(plano.objetivoSemanal)) : '';
    const observacoes = plano.observacoes ? String(getSafeValue(plano.observacoes)) : '';
    const temTextos = Boolean(objetivo || observacoes);
    const temTsb = plano.tsbInicio != null || plano.tsbFim != null;

    const kpis: ComponentProps<typeof KpiStrip>['items'] = [
        { key: 'planejado', label: 'Volume planejado', qualifier: null, value: formatarKm(volumePlanejado), detail: 'Previsto no plano da semana', tone: 'neutral', badge: null },
        { key: 'realizado', label: 'Volume realizado', qualifier: null, value: formatarKm(volumeRealizado), detail: 'Soma dos treinos já realizados', tone: 'neutral', badge: null },
        { key: 'alvo', label: 'Volume alvo', qualifier: null, value: formatarKm(volumeAlvo), detail: 'Meta de volume da semana', tone: 'neutral', badge: null },
        { key: 'treinos', label: 'Treinos', qualifier: null, value: `${treinosRealizados}/${treinos.length}`, detail: 'Realizados no plano', tone: 'neutral', badge: null },
    ];

    return (
        <Stack spacing={2}>
            <Card variant="flat" component="section" aria-label={`Semana ${periodo}`} sx={{ p: 0, overflow: 'hidden' }}>
                <Box
                    sx={{
                        px: GUTTER_X,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={EYEBROW_SX}>Semana planejada</Typography>
                        <Typography
                            component="h3"
                            sx={{
                                mt: 0.25,
                                // Inter (texto) na data do período — pedido do founder; antes herdava a fonte display do h4.
                                fontFamily: activeTheme.font.text,
                                fontWeight: 700,
                                fontSize: { xs: '1rem', md: '1.125rem' },
                                color: surface[50],
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {periodo}
                        </Typography>
                    </Box>
                    <PlanoStatusChip status={status} />
                </Box>

                <KpiStrip items={kpis} testIdPrefix="plano-kpi" sx={{ borderTop: `1px solid ${content.divider}` }} />

                <Box sx={{ px: GUTTER_X, py: 1.5, borderTop: `1px solid ${content.divider}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                        <Typography sx={EYEBROW_SX}>Progresso do volume</Typography>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: surface[50], fontVariantNumeric: 'tabular-nums' }}>
                            {progresso}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(progresso, 100)}
                        aria-label="Progresso do volume da semana"
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: surface[700],
                            '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: semantic.success[500] },
                        }}
                    />
                </Box>

                {temTextos && (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: objetivo && observacoes ? '1fr 1fr' : '1fr' },
                            gap: '1px',
                            backgroundColor: content.divider,
                            borderTop: `1px solid ${content.divider}`,
                        }}
                    >
                        {objetivo && <TextBlock label="Objetivo da semana" text={objetivo} />}
                        {observacoes && <TextBlock label="Observações" text={observacoes} />}
                    </Box>
                )}

                {/* Encerrar semana (ação on-demand do treinador) — não em planos já concluídos */}
                {plano.id && status !== 'CONCLUIDO' && (
                    <Box sx={{ px: GUTTER_X, py: 1.25, borderTop: `1px solid ${content.divider}` }}>
                        <EncerrarSemanaButton
                            planoId={plano.id}
                            onEncerrado={onEncerrado}
                            gerando={gerando}
                            onGerarProximaSemana={onGerarProximaSemana}
                        />
                    </Box>
                )}
            </Card>

            {treinos.length > 0 && (
                <Box component="section" aria-label="Treinos da semana">
                    <Typography sx={{ ...EYEBROW_SX, mb: 1 }}>Treinos da semana · {treinos.length}</Typography>
                    <Grid container spacing={1.5}>
                        {ordenarPorDiaSemana(treinos).map((treino, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={treino.id || index}>
                                <TreinoCard
                                    treino={treino}
                                    onDetalhes={() => onDetalhes(treino)}
                                    onMarcarRealizado={() => onMarcarRealizado(treino, plano.id || '')}
                                    onMarcarPerdido={treino.id ? () => onMarcarPerdido(treino.id!) : undefined}
                                    onRpeSalvo={onRpeSalvo}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {temTsb && (
                <Card variant="flat" sx={{ py: 1.25, px: GUTTER_X, display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
                    <Typography sx={EYEBROW_SX}>TSB (Training Stress Balance)</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: surface[200], fontVariantNumeric: 'tabular-nums' }}>
                        {plano.tsbInicio != null ? <>Início <strong>{getSafeValue(plano.tsbInicio)}</strong></> : null}
                        {plano.tsbInicio != null && plano.tsbFim != null ? ' → ' : null}
                        {plano.tsbFim != null ? <>Fim <strong>{getSafeValue(plano.tsbFim)}</strong></> : null}
                    </Typography>
                </Card>
            )}
        </Stack>
    );
}
