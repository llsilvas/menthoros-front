import React, { useEffect, useState } from 'react';
import {
    Button,
    Typography,
    Box,
    Stack,
    Slider,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as PendingIcon,
    Cancel as CancelIcon,
    InfoOutlined as InfoIcon,
    EmojiEvents as TrophyIcon,
    LightbulbOutlined as InsightIcon,
    ChevronRight as ChevronRightIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { TreinoService } from '../../../api/services/TreinoService';
import { AnaliseService } from '../../../api/services/AnaliseService';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import type { AnaliseWorkout } from '../../../types/AnaliseWorkout';
import { getSafeValue, getSafeNumber } from '../../../utils/safeValues';
import { content, semantic, surface } from '../../../theme/tokens';
import { Card } from '../../../shared/components/Card';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, SECONDARY_OUTLINE_SX, SUCCESS_BTN_SX, WARNING_OUTLINE_SX } from '../../../shared/components/actionButtonSx';
import { effortColor } from '../../../shared/theme/workoutColors';
import { activeTheme, workoutTypeColor } from '../../../theme/activeTheme';
import InsightTreinoDialog, { CausaTexto, NotaExecucao } from './InsightTreinoDialog';
import { formatarDataCurta, formatarDiaCurto, formatarKm, rotuloTipoTreino } from './planoSemanaUtils';

interface TreinoCardProps {
    treino: TreinoPlanejado;
    onDetalhes: () => void;
    onMarcarRealizado: () => void;
    onMarcarPerdido?: () => void;
    /** Chamado após salvar o RPE: o card só guarda o valor em estado local, então quem monta a
     * lista precisa recarregar os dados — senão trocar de semana e voltar mostra o RPE antigo. */
    onRpeSalvo?: () => void;
}

const MONO = activeTheme.font.mono;

/** Linha rótulo/valor para métricas extras (ritmo alvo, RPE realizado). Número em mono. */
const MetricRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>{label}</Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 700, color: color ?? surface[50] }}>
            {value}
        </Typography>
    </Box>
);

const RPE_MARKS = [1,2,3,4,5,6,7,8,9,10].map(v => ({ value: v, label: String(v) }));

const TreinoCard: React.FC<TreinoCardProps> = ({ treino, onDetalhes, onMarcarRealizado, onMarcarPerdido, onRpeSalvo }) => {
    const [insightOpen, setInsightOpen] = useState(false);
    const [rpeDialogOpen, setRpeDialogOpen] = useState(false);
    const [rpeValue, setRpeValue] = useState<number>(treino.percepcaoEsforcoRealizado ?? 5);
    const [currentRpe, setCurrentRpe] = useState<number | undefined>(treino.percepcaoEsforcoRealizado);
    const [savingRpe, setSavingRpe] = useState(false);
    const [analise, setAnalise] = useState<AnaliseWorkout | null>(null);
    const [analiseStatus, setAnaliseStatus] = useState<'idle' | 'loading' | 'pending' | 'done' | 'error'>('idle');

    const statusValue = typeof treino.statusTreino === 'object'
        ? treino.statusTreino?.value
        : treino.statusTreino;
    const isRealizado = statusValue === 'REALIZADO' || treino.realizado === true;
    const isPerdido = statusValue === 'PERDIDO';
    const hoje = new Date().toISOString().split('T')[0];
    const treinoPassado = treino.dataTreino ? treino.dataTreino <= hoje : false;
    const podeMarcardPerdido = !isRealizado && !isPerdido && treinoPassado && !!onMarcarPerdido;
    const duracaoDisplay = treino.duracaoMin != null ? String(treino.duracaoMin) : null;
    const ritmoAlvo = getSafeValue(treino.ritmoAlvo);
    const rpeEsperado = treino.percepcaoEsforcoEsperada;

    // Busca análise AI quando treino realizado tem RPE definido
    useEffect(() => {
        if (!isRealizado || !treino.treinoRealizadoId || currentRpe == null) return;
        setAnaliseStatus('loading');
        AnaliseService.getAnaliseTreino(treino.treinoRealizadoId)
            .then((data) => {
                if (!data) {
                    setAnaliseStatus('pending');
                    return;
                }
                if (data.status === 'COMPLETED') {
                    setAnalise(data);
                    setAnaliseStatus('done');
                } else if (data.status === 'PENDING') {
                    setAnaliseStatus('pending');
                } else {
                    setAnaliseStatus('error');
                }
            })
            .catch(() => setAnaliseStatus('idle'));
    }, [isRealizado, treino.treinoRealizadoId, currentRpe]);

    const mostrarInsight = isRealizado && (analiseStatus === 'done' || analiseStatus === 'pending' || analiseStatus === 'loading');
    // Estado: borda 1px + tinta suave. O texto do estado vai no cabeçalho — cor nunca é o único sinal.
    const estadoCor = isRealizado ? semantic.success[500] : isPerdido ? semantic.danger[500] : null;
    const estadoLabel = isRealizado ? 'Realizado' : isPerdido ? 'Perdido' : 'Pendente';
    const tipoCodigo = String(getSafeValue(treino.tipoTreino));
    const diaCurto = formatarDiaCurto(String(getSafeValue(treino.diaSemana)));
    const dataCurta = treino.dataTreino ? formatarDataCurta(treino.dataTreino) : null;
    const metricas = [
        { label: 'Distância', value: formatarKm(getSafeNumber(treino.distanciaKm)) },
        { label: 'Duração', value: duracaoDisplay ?? '—' },
        { label: 'Esforço esp.', value: typeof rpeEsperado === 'number' ? `${rpeEsperado}/10` : '—' },
    ];

    return (
        <Card
            variant="flat"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                ...(estadoCor ? { borderColor: `${estadoCor}73`, backgroundColor: `${estadoCor}14` } : {}),
            }}
        >
            <Box sx={{ flexGrow: 1 }}>
                {/* Cabeçalho: dia · data e estado (ícone + texto) */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.25 }}>
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 22,
                            px: 1,
                            borderRadius: '11px',
                            border: `1px solid ${content.cardBorder}`,
                            fontFamily: MONO,
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: surface[200],
                        }}
                    >
                        {dataCurta ? `${diaCurto} · ${dataCurta}` : diaCurto}
                    </Box>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.75rem', fontWeight: 600, color: surface[200] }}>
                        {isRealizado ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: semantic.success[500] }} />
                        ) : isPerdido ? (
                            <CancelIcon sx={{ fontSize: 16, color: semantic.danger[500] }} />
                        ) : (
                            <PendingIcon sx={{ fontSize: 16, color: surface[500] }} />
                        )}
                        {estadoLabel}
                    </Box>
                </Box>

                {/* Tipo: cor da categoria + rótulo PT-BR */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, minWidth: 0 }}>
                    <Box aria-hidden sx={{ flex: 'none', width: 10, height: 10, borderRadius: '3px', bgcolor: workoutTypeColor(tipoCodigo) }} />
                    <Typography sx={{ fontSize: '0.9375rem', lineHeight: 1.3, fontWeight: 600, color: surface[50] }}>
                        {rotuloTipoTreino(tipoCodigo)}
                    </Typography>
                </Box>

                {/* Métricas principais: 3 colunas, números em mono */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                    {metricas.map((m) => (
                        <Box key={m.label} sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.6875rem', lineHeight: 1.3, color: surface[400] }}>{m.label}</Typography>
                            <Typography sx={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 700, color: surface[50] }}>
                                {m.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* "Ritmo alvo" sempre aparece (— quando ausente): sem isso a linha do grid fica irregular. */}
                {(ritmoAlvo || isRealizado) && (
                    <Box sx={{ mt: 1.25, pt: 1.25, borderTop: `1px solid ${content.divider}`, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <MetricRow label="Ritmo alvo" value={ritmoAlvo ? String(ritmoAlvo) : '—'} />
                        {isRealizado && (
                            <MetricRow
                                label="Esforço realizado (RPE)"
                                value={currentRpe != null ? `${currentRpe}/10` : '—'}
                                color={currentRpe != null ? effortColor(currentRpe) : undefined}
                            />
                        )}
                    </Box>
                )}
            </Box>

            {mostrarInsight && (
                <Box sx={{ pt: 1.25, borderTop: `1px solid ${content.divider}` }}>
                    {(analiseStatus === 'loading' || analiseStatus === 'pending') && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontStyle: 'italic' }}>
                            {analiseStatus === 'loading' ? 'Carregando análise…' : 'Análise AI em andamento…'}
                        </Typography>
                    )}

                    {analiseStatus === 'done' && analise && (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                                {analise.primaryCause ? (
                                    <CausaTexto causa={analise.primaryCause} />
                                ) : (
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: surface[400] }}>
                                        <InsightIcon sx={{ fontSize: 14 }} />
                                        <Typography sx={{ fontSize: '0.6875rem', lineHeight: 1.3 }}>Coach Insight</Typography>
                                    </Box>
                                )}
                                {analise.executionScore != null && <NotaExecucao valor={analise.executionScore} compacto />}
                            </Box>

                            <Typography
                                sx={{
                                    fontSize: '0.75rem',
                                    color: surface[200],
                                    lineHeight: 1.35,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {analise.summary}
                            </Typography>

                            <Button
                                size="small"
                                onClick={() => setInsightOpen(true)}
                                endIcon={<ChevronRightIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                    ...GHOST_BTN_SX,
                                    color: surface[200],
                                    mt: 0.25,
                                    minHeight: 28,
                                    px: 0,
                                    textTransform: 'none',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    '&:hover': { color: surface[50], bgcolor: 'transparent', textDecoration: 'underline' },
                                }}
                            >
                                Ver insight completo
                            </Button>
                        </>
                    )}
                </Box>
            )}

            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={onDetalhes}
                    sx={{ ...SECONDARY_OUTLINE_SX, textTransform: 'none', flex: 1, minWidth: 0 }}
                >
                    Detalhes
                </Button>
                {isRealizado && treino.treinoRealizadoId && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={currentRpe != null ? <EditIcon /> : <AddIcon />}
                        onClick={() => {
                            setRpeValue(currentRpe ?? 5);
                            setRpeDialogOpen(true);
                        }}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            ...(currentRpe != null ? SECONDARY_OUTLINE_SX : WARNING_OUTLINE_SX),
                        }}
                    >
                        RPE
                    </Button>
                )}
                {podeMarcardPerdido && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={onMarcarPerdido}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            color: semantic.danger[500],
                            borderColor: semantic.danger[500],
                            '&:hover': {
                                bgcolor: `${semantic.danger[500]}14`,
                                borderColor: semantic.danger[700],
                            },
                        }}
                    >
                        Perdido
                    </Button>
                )}
                {!isRealizado && !isPerdido && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<TrophyIcon />}
                        onClick={onMarcarRealizado}
                        sx={{ ...SUCCESS_BTN_SX, flex: 1, minWidth: 0 }}
                    >
                        Realizado
                    </Button>
                )}
            </Stack>

            {/* Dialog de RPE */}
            <CoachDialog
                open={rpeDialogOpen}
                onClose={() => setRpeDialogOpen(false)}
                maxWidth="xs"
                disableClose={savingRpe}
                title="Percepção de Esforço (RPE)"
                subtitle="Como você avalia o esforço deste treino?"
                actions={
                    <>
                        <Button
                            onClick={() => setRpeDialogOpen(false)}
                            disabled={savingRpe}
                            sx={GHOST_BTN_SX}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            disabled={savingRpe}
                            onClick={async () => {
                                if (!treino.treinoRealizadoId) return;
                                setSavingRpe(true);
                                try {
                                    await TreinoService.atualizarTreino(treino.treinoRealizadoId, {
                                        percepcaoEsforco: rpeValue,
                                    });
                                    setCurrentRpe(rpeValue);
                                    setRpeDialogOpen(false);
                                    onRpeSalvo?.();
                                } finally {
                                    setSavingRpe(false);
                                }
                            }}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: effortColor(rpeValue), color: surface[50], '&:hover': { bgcolor: effortColor(rpeValue), filter: 'brightness(0.9)' } }}
                        >
                            {savingRpe ? 'Salvando…' : 'Salvar RPE'}
                        </Button>
                    </>
                }
            >
                <Box sx={{ px: 1, pt: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Typography
                            variant="h2"
                            sx={{ fontWeight: 800, color: effortColor(rpeValue), lineHeight: 1 }}
                        >
                            {rpeValue}
                        </Typography>
                        <Typography variant="h5" sx={{ alignSelf: 'flex-end', color: surface[400], ml: 0.5 }}>
                            /10
                        </Typography>
                    </Box>
                    <Slider
                        value={rpeValue}
                        onChange={(_, v) => setRpeValue(v as number)}
                        min={1}
                        max={10}
                        step={1}
                        marks={RPE_MARKS}
                        sx={{
                            color: effortColor(rpeValue),
                            '& .MuiSlider-markLabel': { fontSize: '0.7rem', color: surface[400] },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: surface[400] }}>Muito leve</Typography>
                        <Typography variant="caption" sx={{ color: surface[400] }}>Máximo</Typography>
                    </Box>
                </Box>
            </CoachDialog>

            {analise && (
                <InsightTreinoDialog
                    open={insightOpen}
                    onClose={() => setInsightOpen(false)}
                    analise={analise}
                    titulo={`${rotuloTipoTreino(tipoCodigo)} · ${formatarKm(getSafeNumber(treino.distanciaKm))}`}
                    dia={treino.dataTreino ? `${diaCurto} · ${formatarDataCurta(treino.dataTreino)}` : undefined}
                />
            )}
        </Card>
    );
};

export default TreinoCard;
