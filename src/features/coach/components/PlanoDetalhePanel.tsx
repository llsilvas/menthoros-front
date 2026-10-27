import { useState } from 'react';
import {
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    IconButton,
    TextField,
    Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import type { DiaSemanaDto, PlanoSemanalDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';
import { primary, surface, semantic, content } from '../../../theme/tokens';
import { workoutTypeColor } from '../../../theme/activeTheme';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { resolvePlannerReviewBadge, resolvePlannerReviewReasons } from '../adapters/plannerReviewAdapters';
import { mesclarPlanoPorDia } from '../adapters/mesclarPlanoPorDia';
import { indiceDoDia, isoDoDiaNaSemana, weekDatesFromInicio } from '../../../utils/semana';
import { rotuloDiaComData, tipoTreinoLabel } from './tiposTreino';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { DANGER_BTN_SX, GHOST_BTN_SX } from '../../../shared/components/actionButtonSx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolverDiaSemana(dia: string | DiaSemanaDto): string {
    if (typeof dia === 'string') return dia;
    return dia.short ?? dia.label ?? dia.value;
}

function parseDuracao(valor: string): string | null {
    if (!valor) return null;
    // ISO-8601: PT90M, PT1H30M
    const iso = valor.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (iso) {
        const h = parseInt(iso[1] ?? '0', 10);
        const m = parseInt(iso[2] ?? '0', 10);
        const total = h * 60 + m;
        return total > 0 ? `${total}min` : null;
    }
    // Legado HH:MM:SS ou MM:SS (mapper durationToString)
    const hms = valor.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (hms) {
        const h = parseInt(hms[1] ?? '0', 10);
        const m = parseInt(hms[2], 10);
        const total = h * 60 + m;
        return total > 0 ? `${total}min` : null;
    }
    return null;
}

function formatarData(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short',
    });
}

// ── Tag de descanso ───────────────────────────────────────────────────────────

/** Nome do dia em minúsculas para o rótulo acessível ("Descanso na quinta: ..."). */
const DIA_POR_EXTENSO: Record<string, string> = {
    SEGUNDA: 'segunda', TERCA: 'terça', QUARTA: 'quarta', QUINTA: 'quinta',
    SEXTA: 'sexta', SABADO: 'sábado', DOMINGO: 'domingo',
};

/**
 * Descanso prescrito pela IA (show-descanso-no-plano). Sem duração/RPE/zona de propósito: não é
 * sessão a cumprir. O `reason` aparece como veio — é texto escrito para o treinador.
 */
function DescansoTag({
    dia,
    motivo,
    onPrescrever,
}: {
    dia: string;
    motivo: string;
    onPrescrever?: () => void;
}) {
    const cor = surface[500];
    return (
        <Box
            data-testid={`chip-descanso-${dia}`}
            aria-label={`Descanso na ${DIA_POR_EXTENSO[dia] ?? dia.toLowerCase()}: ${motivo}`}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                borderRadius: '6px',
                borderLeft: `3px dashed ${cor}`,
                border: `1px dashed ${cor}55`,
                bgcolor: `${cor}0A`,
                px: 1, py: 0.75, gap: 0.25,
            }}
        >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: surface[300], letterSpacing: 0.4 }}>
                {dia.slice(0, 3)} · Descanso
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: surface[400], lineHeight: 1.35 }}>
                {motivo}
            </Typography>
            {onPrescrever && (
                <Button
                    data-testid={`acao-prescrever-${dia}`}
                    size="small"
                    onClick={onPrescrever}
                    sx={{ alignSelf: 'flex-start', fontSize: '0.72rem', px: 0.5, minWidth: 0 }}
                >
                    Prescrever treino neste dia
                </Button>
            )}
        </Box>
    );
}

// ── Tag de treino ─────────────────────────────────────────────────────────────

/**
 * Card de um treino do plano.
 *
 * Revisto em improve-plan-edit-usability: o tipo e as métricas estavam em 8,6px (abaixo do mínimo
 * de 11px que o próprio inbox fixa), os ícones de editar/excluir tinham 12px em cor quase invisível
 * e o corpo do card — 150×90px — não abria nada. A justificativa da IA, que é o que o treinador
 * precisa para decidir, não aparecia em lugar nenhum da Revisão.
 */
function TreinoTag({
    treino,
    data,
    onEditar,
    onExcluir,
}: {
    treino: TreinoPlanejadoDto;
    /** Data do dia na semana do plano; `undefined` quando o dia não é reconhecido. */
    data?: Date;
    onEditar?: () => void;
    onExcluir?: () => void;
}) {
    const cor = workoutTypeColor(treino.tipoTreino);
    const isProva = treino.tipoTreino === 'PROVA';
    // Nome da prova no lugar do rótulo genérico do tipo (mesmo destaque da agenda do atleta).
    const abbrev = isProva ? (treino.descricao || 'Prova') : tipoTreinoLabel(treino.tipoTreino);
    const diaEnum = resolverDiaSemana(treino.diaSemana);
    const dia = rotuloDiaComData(diaEnum, data);
    const duracaoDisplay = treino.duracaoMin ? parseDuracao(treino.duracaoMin) : null;

    const metaItems = [
        duracaoDisplay,
        treino.zonaAlvo,
        treino.percepcaoEsforcoEsperada != null ? `RPE ${treino.percepcaoEsforcoEsperada}` : null,
    ].filter(Boolean);

    // Para o treinador: por que a IA prescreveu isto. Sem a justificativa o card é só número.
    const porQue = treino.justificativaIa?.trim() || (!isProva ? treino.descricao?.trim() : undefined);

    const corpo = (
        <>
            {/* Distância — hero number */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.25 }}>
                <Typography
                    sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: cor,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        textShadow: `0 0 20px ${cor}40`,
                    }}
                >
                    {treino.distanciaKm}
                </Typography>
                <Typography
                    sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', fontWeight: 600, color: `${cor}90`, lineHeight: 1, mb: '2px' }}
                >
                    km
                </Typography>
            </Box>

            {/* Tipo + métricas — nunca abaixo de 11px */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cor, letterSpacing: '0.04em', lineHeight: 1.2 }}>
                    {abbrev}
                </Typography>
                {metaItems.length > 0 && (
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: surface[400], lineHeight: 1.3 }}>
                        {metaItems.join(' · ')}
                    </Typography>
                )}
                {porQue && (
                    <Typography
                        data-testid="treino-justificativa"
                        title={porQue}
                        sx={{
                            mt: 0.25,
                            fontSize: '0.72rem',
                            color: surface[300],
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {porQue}
                    </Typography>
                )}
            </Box>
        </>
    );

    return (
        <Box
            data-testid={`tag-treino-${treino.id ?? 'sem-id'}`}
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                borderRadius: '6px',
                // Borda esquerda grossa na cor do tipo — elemento visual dominante
                borderLeft: `3px solid ${cor}`,
                borderTop: `1px solid ${cor}20`,
                borderRight: `1px solid ${cor}14`,
                borderBottom: `1px solid ${cor}14`,
                bgcolor: `${cor}07`,
                backgroundImage: `linear-gradient(160deg, ${cor}0D 0%, transparent 55%)`,
                overflow: 'hidden',
            }}
        >
            {/* Stripe decorativa no topo */}
            <Box sx={{ height: '2px', background: `linear-gradient(90deg, ${cor}50, transparent)` }} />

            {/* Dia da semana + ações */}
            <Box sx={{ px: 1.25, pt: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    {isProva && (
                        <FlagIcon data-testid="icone-prova" sx={{ fontSize: 12, color: cor }} aria-hidden />
                    )}
                    {treino.editadoPeloCoach && (
                        <Box
                            data-testid="chip-editado-coach"
                            role="img"
                            aria-label="Editado pelo treinador"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: semantic.warning[400], boxShadow: `0 0 4px ${semantic.warning[500]}`, flexShrink: 0 }}
                        />
                    )}
                    {treino.adicionadoPeloCoach && (
                        <Box
                            data-testid="chip-adicionado-coach"
                            role="img"
                            aria-label="Adicionado pelo treinador"
                            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primary[400], boxShadow: `0 0 4px ${primary[500]}`, flexShrink: 0 }}
                        />
                    )}
                    <Typography
                        sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', fontWeight: 700, color: surface[200], letterSpacing: '0.08em', lineHeight: 1 }}
                        noWrap
                    >
                        {dia}
                    </Typography>
                </Box>
                {(onEditar || onExcluir) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        {onEditar && (
                            <IconButton
                                size="small"
                                aria-label="Editar treino"
                                onClick={onEditar}
                                sx={{ p: 0.5, color: surface[400], borderRadius: '4px', '&:hover': { color: cor, bgcolor: `${cor}18` } }}
                            >
                                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                        {onExcluir && (
                            <IconButton
                                size="small"
                                aria-label="Excluir treino"
                                onClick={onExcluir}
                                sx={{ p: 0.5, color: surface[400], borderRadius: '4px', '&:hover': { color: semantic.danger[500], bgcolor: `${semantic.danger[500]}18` } }}
                            >
                                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>

            {/*
              O corpo inteiro abre a edição quando ela está disponível — a porta não é mais só o
              ícone. Fica FORA da linha de ações para não aninhar botão dentro de botão.
            */}
            {onEditar ? (
                <ButtonBase
                    onClick={onEditar}
                    aria-label={`Abrir treino de ${dia}`}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        textAlign: 'left',
                        gap: 0.5,
                        px: 1.25,
                        pt: 0.5,
                        pb: 1,
                        width: '100%',
                        transition: 'background-color 150ms ease',
                        '&:hover': { bgcolor: `${cor}12` },
                        '&.Mui-focusVisible': { outline: `2px solid ${cor}`, outlineOffset: -2 },
                    }}
                >
                    {corpo}
                </ButtonBase>
            ) : (
                <Box sx={{ px: 1.25, pt: 0.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {corpo}
                </Box>
            )}
        </Box>
    );
}

/** Legenda dos pontos de "editado"/"adicionado" — só quando algum card os mostra. */
function LegendaMarcadores({ editado, adicionado }: { editado: boolean; adicionado: boolean }) {
    if (!editado && !adicionado) return null;
    const item = { display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.7rem', color: surface[400] } as const;
    return (
        <Box data-testid="legenda-marcadores" sx={{ display: 'flex', gap: 1.5, mt: 1.25, flexWrap: 'wrap' }}>
            {editado && (
                <Box sx={item}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: semantic.warning[400] }} />
                    editado por você
                </Box>
            )}
            {adicionado && (
                <Box sx={item}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primary[400] }} />
                    adicionado por você
                </Box>
            )}
        </Box>
    );
}

// ── Modal de rejeição ─────────────────────────────────────────────────────────

interface RejeicaoModalProps {
    open: boolean;
    isActing: boolean;
    onClose: () => void;
    onConfirmar: (motivo: string) => void;
}

function RejeicaoModal({ open, isActing, onClose, onConfirmar }: RejeicaoModalProps) {
    const [motivo, setMotivo] = useState('');

    const handleConfirmar = () => {
        if (!motivo.trim()) return;
        onConfirmar(motivo.trim());
        setMotivo('');
    };

    const handleClose = () => {
        if (isActing) return;
        setMotivo('');
        onClose();
    };

    return (
        <CoachDialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            disableClose={isActing}
            title="Rejeitar plano"
            actions={
                <>
                    <Button
                        variant="text"
                        onClick={handleClose}
                        disabled={isActing}
                        sx={{ ...GHOST_BTN_SX, fontSize: '0.8rem' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmar}
                        disabled={!motivo.trim() || isActing}
                        sx={{
                            ...DANGER_BTN_SX,
                            fontSize: '0.8rem',
                            px: 2.5,
                            '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                        }}
                    >
                        {isActing
                            ? <CircularProgress size={14} sx={{ color: surface[900] }} />
                            : 'Confirmar rejeição'}
                    </Button>
                </>
            }
        >
            <Typography sx={{ fontSize: '0.8rem', color: surface[400], mb: 1.5 }}>
                Explique ao atleta o motivo pelo qual este plano não será utilizado.
            </Typography>
            <TextField
                autoFocus
                fullWidth
                multiline
                rows={4}
                label="Motivo da rejeição"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={isActing}
                inputProps={{ maxLength: 1000 }}
                helperText={`${motivo.length}/1000`}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
            />
        </CoachDialog>
    );
}

// ── Estado vazio ──────────────────────────────────────────────────────────────

function EstadoVazio() {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.35,
            }}
        >
            <Typography
                sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: surface[500],
                    letterSpacing: '0.04em',
                }}
            >
                Selecione um plano
            </Typography>
        </Box>
    );
}

// ── Métrica ───────────────────────────────────────────────────────────────────

function Metrica({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
                sx={{
                    fontSize: '0.58rem',
                    fontWeight: 600,
                    color: surface[600],
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: accent ? primary[400] : surface[200],
                    lineHeight: 1,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

// ── Painel principal ──────────────────────────────────────────────────────────

interface PlanoDetalhePanelProps {
    plano: PlanoSemanalDto | null;
    isActing: boolean;
    onAprovar: () => void;
    onRejeitar: (motivo: string) => void;
    onEditarTreino?: (treinoId: string) => void;
    onExcluirTreino?: (treinoId: string) => void;
    onAdicionarTreino?: () => void;
    /** Prescrever treino num dia hoje prescrito como descanso — recebe a data ISO daquele dia. */
    onPrescreverNoDia?: (dataTreino: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
    AGUARDANDO_REVISAO: semantic.warning[500],
    APROVADO:           semantic.success[500],
    REJEITADO:          semantic.danger[500],
};

const STATUS_LABEL: Record<string, string> = {
    AGUARDANDO_REVISAO: 'Aguardando',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
};

/** prova-no-plano-semanal, D4: por que um plano aprovado voltou a aguardar revisão. */
const REABERTURA_LABEL: Record<'PROVA_INSERIDA' | 'PROVA_REMOVIDA', string> = {
    PROVA_INSERIDA: 'Reaberto: prova inserida',
    PROVA_REMOVIDA: 'Reaberto: prova removida',
};

export function PlanoDetalhePanel({
    plano,
    isActing,
    onAprovar,
    onRejeitar,
    onEditarTreino,
    onExcluirTreino,
    onAdicionarTreino,
    onPrescreverNoDia,
}: PlanoDetalhePanelProps) {
    const [modalAberto, setModalAberto] = useState(false);

    if (!plano) return <EstadoVazio />;

    const sessoes = plano.treinosPlanejados ?? [];
    // show-descanso-no-plano: treinos e descansos numa lista só, sempre em ordem de dia (CA6/CA2b).
    const itensDoPlano = mesclarPlanoPorDia(sessoes, plano.restDays);
    const datasDaSemana = weekDatesFromInicio(plano.semanaInicio);
    const periodo = `${formatarData(plano.semanaInicio)} – ${formatarData(plano.semanaFim)}`;

    // Derivado dos treinos individuais — reflete edições sem depender do campo estático do backend
    const volumeCalculadoKm = sessoes.reduce((sum, t) => sum + (t.distanciaKm ?? 0), 0);
    const volumeLabel = volumeCalculadoKm > 0
        ? `${parseFloat(volumeCalculadoKm.toFixed(1))} km`
        : `${plano.volumePlanejadoKm} km`;
    const reviewStatusValue = resolveReviewStatus(plano.reviewStatus);
    const isAguardando = reviewStatusValue === 'AGUARDANDO_REVISAO';
    const statusColor = STATUS_COLOR[reviewStatusValue] ?? STATUS_COLOR.AGUARDANDO_REVISAO;
    const statusLabel = STATUS_LABEL[reviewStatusValue] ?? reviewStatusValue;
    const reaberturaLabel = plano.motivoReabertura ? REABERTURA_LABEL[plano.motivoReabertura] : null;
    // planner-engine-enforcement §7.2: destaque de revisão obrigatória por divergência do planner.
    const plannerBadge = resolvePlannerReviewBadge(plano);
    const plannerReasons = resolvePlannerReviewReasons(plano);

    const handleRejeitar = (motivo: string) => {
        setModalAberto(false);
        onRejeitar(motivo);
    };

    const tsbLabel = plano.tsbInicio != null
        ? (plano.tsbInicio >= 0 ? `+${plano.tsbInicio.toFixed(1)}` : `${plano.tsbInicio.toFixed(1)}`)
        : '—';

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* ── Cabeçalho ─────────────────────────────────────────────── */}
            <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${content.divider}`, flexShrink: 0 }}>

                {/* Status + período */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
                        <Typography
                            sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: statusColor,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {statusLabel}
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.65rem',
                            color: surface[600],
                            letterSpacing: '0.02em',
                        }}
                    >
                        {periodo}
                    </Typography>
                </Box>

                {/* Reaberto por prova (prova-no-plano-semanal, D4) */}
                {reaberturaLabel && (
                    <Box
                        data-testid="chip-reaberto"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.375,
                            mb: 1.25,
                            borderRadius: '999px',
                            border: `1px solid ${primary[500]}45`,
                            bgcolor: `${primary[500]}10`,
                        }}
                    >
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: primary[500], letterSpacing: '0.04em' }}>
                            {reaberturaLabel}
                        </Typography>
                    </Box>
                )}

                {/* Revisão obrigatória do planner (planner-engine-enforcement §7.2) */}
                {plannerBadge && (
                    <Box data-testid="planner-review-block" sx={{ mb: 1.25 }}>
                        <StatusBadge variant={plannerBadge.variant} label={plannerBadge.label} size="sm" />
                        {plannerReasons.length > 0 && (
                            <Box
                                component="ul"
                                sx={{
                                    listStyle: 'none',
                                    m: 0,
                                    mt: 0.75,
                                    p: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.375,
                                }}
                            >
                                {plannerReasons.map((motivo, i) => (
                                    <Typography
                                        key={i}
                                        component="li"
                                        sx={{ fontSize: '0.72rem', color: surface[400], lineHeight: 1.4 }}
                                    >
                                        • {motivo}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Nome do atleta */}
                <Typography
                    sx={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: surface[50],
                        lineHeight: 1.15,
                        letterSpacing: '-0.01em',
                        mb: 0,
                    }}
                >
                    {plano.atletaNome ?? 'Atleta'}
                </Typography>

                <Typography
                    sx={{
                        fontSize: '0.80rem',
                        fontWeight: 300,
                        color: surface[50],
                        lineHeight: 1.35,
                        letterSpacing: '-0.01em',
                        mb: 0,
                    }}
                >
                    {plano.objetivoSemanal ?? 'Atleta'}
                </Typography>
            </Box>

            {/* ── Métricas ──────────────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    py: 1.75,
                    borderBottom: `1px solid ${content.divider}`,
                    display: 'flex',
                    gap: 3,
                    flexShrink: 0,
                }}
            >
                <Metrica label="Volume" value={volumeLabel} accent />
                {plano.volumeAlvoKm > 0 && (
                    <Metrica label="Alvo" value={`${plano.volumeAlvoKm} km`} />
                )}
                <Metrica label="TSB" value={tsbLabel} />
                {sessoes.length > 0 && (
                    <Metrica label="Sessões" value={String(sessoes.length)} />
                )}
            </Box>

            {/* ── Treinos ───────────────────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 3,
                    py: 2,
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: surface[700], borderRadius: 2 },
                }}
            >
                {itensDoPlano.length === 0 ? (
                    <Typography sx={{ fontSize: '0.75rem', color: surface[600], fontStyle: 'italic' }}>
                        Nenhuma sessão disponível.
                    </Typography>
                ) : (
                    /*
                      Grade com colunas de largura igual, em vez de flex-wrap: os cards alinham em
                      linhas e colunas e a leitura segue a ordem da semana. Uma coluna por dia (seg→dom)
                      não cabe no painel em notebook (~107px por dia); fica para quando houver largura.
                    */
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 1 }}>
                        {itensDoPlano.map((item, i) => item.kind === 'descanso' ? (
                            <DescansoTag
                                key={`descanso-${item.dia}`}
                                dia={item.dia}
                                motivo={item.descanso.reason}
                                onPrescrever={isAguardando && onPrescreverNoDia
                                    ? () => onPrescreverNoDia(isoDoDiaNaSemana(datasDaSemana, item.dia))
                                    : undefined}
                            />
                        ) : (
                            <TreinoTag
                                key={item.treino.id ?? i}
                                treino={item.treino}
                                data={indiceDoDia(item.dia) >= 0 ? datasDaSemana[indiceDoDia(item.dia)] : undefined}
                                onEditar={isAguardando && item.treino.id && onEditarTreino
                                    ? () => onEditarTreino(item.treino.id!)
                                    : undefined}
                                onExcluir={isAguardando && item.treino.id && onExcluirTreino
                                    ? () => onExcluirTreino(item.treino.id!)
                                    : undefined}
                            />
                        ))}
                    </Box>
                )}

                <LegendaMarcadores
                    editado={sessoes.some((t) => t.editadoPeloCoach)}
                    adicionado={sessoes.some((t) => t.adicionadoPeloCoach)}
                />

                {isAguardando && onAdicionarTreino && (
                    <Box sx={{ mt: 1.5 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                            onClick={onAdicionarTreino}
                            aria-label="Adicionar treino"
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: primary[500],
                                borderColor: `${primary[500]}50`,
                                borderRadius: '6px',
                                px: 1.25,
                                py: 0.5,
                                '&:hover': { borderColor: primary[500], bgcolor: `${primary[500]}0A` },
                            }}
                        >
                            Adicionar treino
                        </Button>
                    </Box>
                )}

                {plano.reviewComment && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            borderRadius: '6px',
                            border: `1px solid ${semantic.danger[500]}28`,
                            bgcolor: `${semantic.danger[500]}08`,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: semantic.danger[300],
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            Motivo de rejeição
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: surface[400], lineHeight: 1.5 }}>
                            {plano.reviewComment}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Ações ─────────────────────────────────────────────────── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: `1px solid ${content.divider}`,
                    display: 'flex',
                    gap: 1.5,
                    flexShrink: 0,
                }}
            >
                <Button
                    variant="contained"
                    onClick={onAprovar}
                    disabled={isActing || !isAguardando}
                    sx={{
                        flex: 1,
                        bgcolor: primary[500],
                        color: surface[900],
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        boxShadow: isAguardando ? `0 0 20px ${primary[500]}40` : 'none',
                        '&:hover': { bgcolor: primary[400], boxShadow: `0 0 28px ${primary[500]}60` },
                        '&.Mui-disabled': { bgcolor: surface[700], color: surface[500], boxShadow: 'none' },
                    }}
                >
                    {isActing ? <CircularProgress size={14} sx={{ color: surface[900] }} /> : 'Aprovar'}
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => setModalAberto(true)}
                    disabled={isActing || !isAguardando}
                    sx={{
                        flex: 1,
                        borderColor: `${semantic.danger[500]}60`,
                        color: semantic.danger[500],
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        '&:hover': { borderColor: semantic.danger[500], bgcolor: `${semantic.danger[500]}10` },
                        '&.Mui-disabled': { borderColor: surface[700], color: surface[500] },
                    }}
                >
                    Rejeitar
                </Button>
            </Box>

            <RejeicaoModal
                open={modalAberto}
                isActing={isActing}
                onClose={() => setModalAberto(false)}
                onConfirmar={handleRejeitar}
            />
        </Box>
    );
}
