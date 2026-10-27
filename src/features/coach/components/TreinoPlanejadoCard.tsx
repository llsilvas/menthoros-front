import type { ReactNode } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FlagIcon from '@mui/icons-material/Flag';
import { Card } from '../../../shared/components/Card';
import { content, primary, semantic, surface, text } from '../../../theme/tokens';
import { activeTheme, workoutTypeColor } from '../../../theme/activeTheme';
import { COR_ICONE_PENDENTE, type EstadoTreinoVisual } from './treinoPlanejadoEstado';
import type { IntensityLine } from '../adapters/buildIntensityLine';

const MONO = activeTheme.font.mono;

interface TreinoPlanejadoCardProps {
    testId?: string;
    /** "Ter 20/10" — já formatado por quem monta. */
    dia: string;
    tipoTreino: string;
    /** Nome mostrado ao lado do quadradinho (rótulo do tipo, ou o nome da prova). */
    rotulo: string;
    distanciaKm: number;
    /** Minutos; `null` mostra "—". */
    duracaoMin?: number | null;
    rpeEsperado?: number | null;
    zonaAlvo?: string | null;
    /** Zona e faixas do atleta; quando presente, substitui a linha de zona em texto. */
    intensidade?: IntensityLine | null;
    tssPlanejado?: number | null;
    /** Justificativa da IA — por que isto foi prescrito. Até 2 linhas. */
    porQue?: string;
    isProva?: boolean;
    editado?: boolean;
    adicionado?: boolean;
    /** Estado de execução (Realizado/Perdido/Pendente), à direita do nome do tipo; sem ele nada é mostrado. */
    estado?: EstadoTreinoVisual;
    /** Quando presente, o corpo inteiro vira botão que abre o treino. */
    onAbrir?: () => void;
    /** Ações do cabeçalho (editar, excluir…). */
    actions?: ReactNode;
    /** Linha de rodapé (ex.: chip de sincronização). */
    rodape?: ReactNode;
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '0.6875rem', lineHeight: 1.3, color: surface[400] }}>{rotulo}</Typography>
            <Typography noWrap sx={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 700, color: surface[50] }}>
                {valor}
            </Typography>
        </Box>
    );
}

function LinhaMetrica({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: surface[400] }}>{rotulo}</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 700, color: surface[50] }}>{valor}</Typography>
        </Box>
    );
}

const ZONA_CHIP_SX = { fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 700, px: 0.75, borderRadius: '4px' } as const;

/**
 * `Zn · pace · FC`, sempre nessa ordem (a posição não muda com o eixo). O primário se distingue só por
 * peso e cor; lime fica reservado a ação e seleção, nunca à leitura.
 */
function LinhaIntensidade({ linha }: { linha: IntensityLine }) {
    const valor = (eixo: 'PACE' | 'FC', texto: string) => {
        const primario = linha.primario === eixo;
        return (
            <Typography
                key={eixo}
                component="span"
                sx={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: primario ? 600 : 400, color: primario ? text.primary : text.secondary }}
            >
                {texto}
            </Typography>
        );
    };
    if (linha.semMeta) {
        return (
            <Typography data-testid="linha-intensidade" sx={{ fontSize: '0.8125rem', color: text.secondary }}>
                sem meta
            </Typography>
        );
    }
    return (
        <Box data-testid="linha-intensidade" sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1, rowGap: 0.25 }}>
            {linha.zona && (
                <Box
                    component="span"
                    data-testid="chip-zona"
                    sx={{ ...ZONA_CHIP_SX, bgcolor: activeTheme.zones[linha.zona].color, color: activeTheme.primary.contrastText }}
                >
                    {linha.zona}
                </Box>
            )}
            {linha.pace && valor('PACE', linha.pace)}
            {linha.fc && valor('FC', linha.fc)}
            {linha.paceIndisponivel && (
                <Typography component="span" sx={{ fontSize: '0.75rem', color: text.secondary }}>pace indisponível</Typography>
            )}
        </Box>
    );
}

function IconeEstado({ icone, cor }: Pick<EstadoTreinoVisual, 'icone' | 'cor'>) {
    if (icone === 'realizado') return <CheckCircleIcon sx={{ fontSize: 16, color: cor ?? semantic.success[500] }} />;
    if (icone === 'perdido') return <CancelIcon sx={{ fontSize: 16, color: cor ?? surface[500] }} />;
    return <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: COR_ICONE_PENDENTE }} />;
}

/**
 * Card de um treino planejado da Revisão de planos e do Perfil do atleta — o mesmo desenho do
 * `TreinoCard` dos Planos (pílula mono do dia, quadradinho na cor do tipo, métricas em colunas),
 * só visual: o que difere entre as telas entra por `actions`, `rodape`, `estado` e `onAbrir`.
 *
 * Antes eram três cards: o da Revisão (gradiente, listra, número gigante), um local do Perfil
 * (`Box` com borda esquerda, tipo em enum cru) e o dos Planos.
 */
export function TreinoPlanejadoCard({
    testId, dia, tipoTreino, rotulo, distanciaKm, duracaoMin, rpeEsperado, zonaAlvo, intensidade, tssPlanejado,
    porQue, isProva, editado, adicionado, estado, onAbrir, actions, rodape,
}: TreinoPlanejadoCardProps) {
    const corTipo = workoutTypeColor(tipoTreino);
    const corEstado = estado?.cor ?? null;
    const temExtras = Boolean(zonaAlvo) || Boolean(intensidade) || tssPlanejado != null;

    const corpo = (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Box aria-hidden sx={{ flex: 'none', width: 10, height: 10, borderRadius: '3px', bgcolor: corTipo }} />
                <Typography noWrap sx={{ fontSize: '0.9375rem', lineHeight: 1.3, fontWeight: 600, color: surface[50] }}>
                    {rotulo}
                </Typography>
                {estado && (
                    <Box sx={{ ml: 'auto', flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', fontWeight: 600, color: surface[200] }}>
                        <IconeEstado icone={estado.icone} cor={estado.cor} />
                        {estado.rotulo}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                <Metrica rotulo="Distância" valor={`${distanciaKm} km`} />
                <Metrica rotulo="Duração" valor={duracaoMin != null ? `${duracaoMin} min` : '—'} />
                <Metrica rotulo="Esforço" valor={rpeEsperado != null ? `${rpeEsperado}/10` : '—'} />
            </Box>

            {temExtras && (
                <Box sx={{ pt: 1, borderTop: `1px solid ${content.divider}`, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {intensidade ? <LinhaIntensidade linha={intensidade} /> : zonaAlvo ? <LinhaMetrica rotulo="Zona" valor={zonaAlvo} /> : null}
                    {tssPlanejado != null ? <LinhaMetrica rotulo="TSS" valor={String(tssPlanejado)} /> : null}
                </Box>
            )}

            {porQue && (
                <Typography
                    data-testid="treino-justificativa"
                    title={porQue}
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
                    {porQue}
                </Typography>
            )}
        </>
    );

    const corpoSx = { px: 1.5, pb: 1.5, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' } as const;

    return (
        <Card
            variant="flat"
            data-testid={testId}
            sx={{
                p: 0,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                ...(corEstado ? { borderColor: `${corEstado}73`, backgroundColor: `${corEstado}14` } : {}),
            }}
        >
            <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Box
                    component="span"
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        minWidth: 0,
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
                    {isProva && <FlagIcon data-testid="icone-prova" sx={{ fontSize: 12, color: corTipo }} aria-hidden />}
                    {editado && (
                        <Box
                            data-testid="chip-editado-coach"
                            role="img"
                            aria-label="Editado pelo treinador"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: semantic.warning[400], flexShrink: 0 }}
                        />
                    )}
                    {adicionado && (
                        <Box
                            data-testid="chip-adicionado-coach"
                            role="img"
                            aria-label="Adicionado pelo treinador"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primary[400], flexShrink: 0 }}
                        />
                    )}
                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dia}</Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    {actions}
                </Box>
            </Box>

            {/* Corpo inteiro abre o treino quando há `onAbrir` — FORA da linha de ações, sem botão aninhado. */}
            {onAbrir ? (
                <ButtonBase
                    onClick={onAbrir}
                    aria-label={`Abrir treino de ${dia}`}
                    sx={{
                        ...corpoSx,
                        alignItems: 'stretch',
                        textAlign: 'left',
                        transition: 'background-color 150ms ease',
                        '&:hover': { bgcolor: `${corTipo}12` },
                        '&.Mui-focusVisible': { outline: `2px solid ${corTipo}`, outlineOffset: -2 },
                    }}
                >
                    {corpo}
                </ButtonBase>
            ) : (
                <Box sx={corpoSx}>{corpo}</Box>
            )}

            {rodape ? <Box sx={{ px: 1.5, pb: 1.25 }}>{rodape}</Box> : null}
        </Card>
    );
}
