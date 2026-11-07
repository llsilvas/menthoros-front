import { useState } from 'react';
import { Alert, Box, Button, Chip, Grid, IconButton, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import { CalendarToday as CalendarIcon, HourglassEmpty as HourglassIcon, Sync as SyncIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { alpha } from '@mui/material/styles';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import { TreinoEditDialog } from './TreinoEditDialog';
import { NOME_CANAL, buildLockLabelFromRejection, type WatchChannel } from '../adapters/watchChannel';
import { mensagemDeErroAoSalvar } from '../adapters/mensagemDeErroAoSalvar';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { useReenviarSincronizacao } from '../../../hooks/useReenviarSincronizacao';
import { surface, semantic, primary } from '../../../theme/tokens';
import { SyncStatusChip } from './SyncStatusChip';
import { TreinoPlanejadoCard } from './TreinoPlanejadoCard';
import { VerRealizadoAcao } from './VerRealizadoAcao';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { buildIntensityLineFromTreino } from '../adapters/buildIntensityLine';
import { resumoDaSerie } from '../adapters/resumoSerie';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { estadoDeExecucao } from './treinoPlanejadoEstado';
import { rotuloDiaComData, tipoTreinoLabel } from './tiposTreino';
import { duracaoEmMinutos } from '../adapters/duracaoTreino';
import { isErroSync } from '../adapters/syncReason';
import { indiceDoDia, isoDoDiaNaSemana, weekDatesFromInicio } from '../../../utils/semana';

interface CurrentWeekPlanProps {
    plano: PlanoVigenteDto | null;
    /** Atleta dono do plano; habilita as zonas (pace/FC) nos cards. */
    atletaId?: string;
    /** Nome do atleta, no título da tabela de zonas do editor. */
    atletaNome?: string;
    onGerarPlano: () => void;
    onRevisarPlano: () => void;
    /** Recarrega o plano depois de editar um treino ou reenviar ao relógio. */
    onTreinoEditado?: () => void;
    /** Canal ativo do atleta (de `conexaoCanal`); `null` = sem relógio conectado. Usado no aviso de plano aprovado. */
    canal?: WatchChannel | null;
}

/** Canal conectado: o campo novo (Garmin ou intervals.icu) com fallback para perfil antigo. */
function canalConectado(t: TreinoPlanejadoResumoDto): boolean | undefined {
    return t.channelConnected ?? t.atletaConectadoIntervalsIcu;
}

function toDialogTreino(t: TreinoPlanejadoResumoDto, semanaInicio: string): TreinoPlanejadoDto {
    return {
        id: t.id,
        diaSemana: t.diaSemana,
        // O resumo não traz a data; o editor compara o select com ela para só mandar `dataTreino` se mudou (D6).
        dataTreino: isoDoDiaNaSemana(weekDatesFromInicio(semanaInicio), t.diaSemana),
        tipoTreino: t.tipoTreino,
        // O dialog de edição exige número; 0 é o que o resumo mandava antes de a distância virar opcional.
        distanciaKm: t.distanciaKm ?? 0,
        duracaoMin: t.duracaoMin,
        zonaAlvo: t.zonaAlvo,
        percepcaoEsforcoEsperada: t.percepcaoEsforcoEsperada,
        etapas: t.etapas,
    };
}

function TreinoCard({
    treino,
    data,
    zones,
    isAguardando,
    travado,
    onEditar,
}: {
    treino: TreinoPlanejadoResumoDto;
    zones: AthleteTrainingZonesDto | null;
    /** Data do dia na semana do plano; `undefined` quando o dia não é reconhecido. */
    data?: Date;
    isAguardando?: boolean;
    /** Plano aprovado e treino não editável: cadeado com rótulo no lugar do lápis. */
    travado?: boolean;
    onEditar?: () => void;
}) {
    const mostraSync = !isAguardando
        && (treino.statusSincronizacao !== undefined || canalConectado(treino) !== undefined);
    const dia = rotuloDiaComData(treino.diaSemana, data);
    const rotuloCadeado = travado ? buildLockLabelFromRejection(treino.editRejection, treino.statusExecucao) : '';

    return (
        <TreinoPlanejadoCard
            dia={dia}
            tipoTreino={treino.tipoTreino}
            rotulo={[tipoTreinoLabel(treino.tipoTreino), resumoDaSerie(treino.etapas)].filter(Boolean).join(' · ')}
            distanciaKm={treino.distanciaKm}
            duracaoMin={duracaoEmMinutos(treino.duracaoMin)}
            rpeEsperado={treino.percepcaoEsforcoEsperada}
            zonaAlvo={treino.zonaAlvo}
            intensidade={buildIntensityLineFromTreino(treino.etapas, zones)}
            tssPlanejado={treino.tssPlanejado}
            estado={estadoDeExecucao(treino.statusExecucao)}
            editadoAposAprovacao={Boolean(treino.editedAfterApprovalAt)}
            actions={treino.id && onEditar ? (
                <IconButton
                    size="small"
                    onClick={onEditar}
                    aria-label={`Editar treino de ${dia}`}
                    sx={{ p: 0.5, minWidth: 44, minHeight: 44, color: surface[400], '&:hover': { color: primary[400] } }}
                >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
            ) : travado ? (
                <Tooltip title={rotuloCadeado}>
                    <Box role="img" aria-label={rotuloCadeado} tabIndex={0}
                        sx={{ display: 'inline-flex', p: 0.5, color: surface[500] }}>
                        <LockOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Tooltip>
            ) : undefined}
            rodape={mostraSync || treino.treinoRealizadoId ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                    {mostraSync && (
                        <SyncStatusChip
                            statusSincronizacao={treino.statusSincronizacao}
                            atletaConectado={canalConectado(treino)}
                            syncError={treino.syncError}
                        />
                    )}
                    {treino.treinoRealizadoId && (
                        <Box sx={{ ml: 'auto' }}>
                            <VerRealizadoAcao
                                treinoRealizadoId={treino.treinoRealizadoId}
                                planejado={treino}
                                titulo={tipoTreinoLabel(treino.tipoTreino)}
                            />
                        </Box>
                    )}
                </Stack>
            ) : undefined}
        />
    );
}

function TreinosGrid({
    treinos,
    semanaInicio,
    zones,
    isAguardando,
    podeEditar,
    onEditar,
}: {
    treinos: TreinoPlanejadoResumoDto[];
    zones: AthleteTrainingZonesDto | null;
    semanaInicio: string;
    isAguardando?: boolean;
    /** `undefined` = ninguém edita (plano em outro status); senão decide por treino. */
    podeEditar?: (t: TreinoPlanejadoResumoDto) => boolean;
    onEditar?: (t: TreinoPlanejadoResumoDto) => void;
}) {
    if (treinos.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Plano sem treinos detalhados
            </Typography>
        );
    }
    const datasDaSemana = semanaInicio ? weekDatesFromInicio(semanaInicio) : [];
    return (
        // Sem breakpoint `lg` dedicado (herda 4 colunas do `md`) — um `lg: 12/7` anterior
        // forçava 7 cards/linha (1 por dia da semana) e truncava "CONTÍNUO" e o chip de envio.
        <Grid container spacing={1}>
            {treinos.map((t) => (
                <Grid key={t.id ?? t.diaSemana} size={{ xs: 12, sm: 6 }}>
                    <TreinoCard
                        treino={t}
                        zones={zones}
                        data={indiceDoDia(t.diaSemana) >= 0 ? datasDaSemana[indiceDoDia(t.diaSemana)] : undefined}
                        isAguardando={isAguardando}
                        // cadeado só onde o backend disse "não"; perfil antigo (sem `editable`) fica sem os dois
                        travado={!isAguardando && t.editable === false}
                        onEditar={onEditar && podeEditar?.(t) ? () => onEditar(t) : undefined}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

function ReenvioRelogio({
    treinos,
    reenviando,
    erro,
    resent,
    onReenviar,
}: {
    treinos: TreinoPlanejadoResumoDto[];
    reenviando: boolean;
    erro: string | null;
    /** Treinos reenviados no último clique; `null` antes de reenviar. */
    resent: number | null;
    onReenviar: () => void;
}) {
    const semCanal = treinos.length > 0 && treinos.every((t) => canalConectado(t) === false);
    const emAndamento = treinos.some((t) => t.syncInProgress);
    const bloqueio = semCanal ? 'Atleta sem canal conectado' : emAndamento ? 'Envio em andamento' : '';

    return (
        <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    Há treinos que não chegaram ao relógio
                </Typography>
                <Tooltip title={bloqueio}>
                    {/* span: o Tooltip precisa de um filho que receba eventos com o botão desabilitado */}
                    <span>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SyncIcon />}
                            disabled={reenviando || Boolean(bloqueio)}
                            onClick={onReenviar}
                        >
                            {reenviando ? 'Reenviando…' : 'Reenviar ao relógio'}
                        </Button>
                    </span>
                </Tooltip>
            </Stack>
            {resent !== null && !erro && (
                <Alert severity={resent > 0 ? 'success' : 'info'} variant="outlined">
                    {resent > 0
                        ? 'Reenvio solicitado — o status dos treinos atualiza em alguns segundos.'
                        : 'Nenhum treino em erro para reenviar.'}
                </Alert>
            )}
            {erro && <Alert severity="warning" variant="outlined">{erro}</Alert>}
        </Stack>
    );
}

export function CurrentWeekPlan({ plano, atletaId, atletaNome, onGerarPlano, onRevisarPlano, onTreinoEditado, canal = null }: CurrentWeekPlanProps) {
    const { zones } = useAthleteTrainingZones(atletaId);
    const [editingTreino, setEditingTreino] = useState<TreinoPlanejadoDto | null>(null);
    const { isSaving, editarTreino } = useTreinoPlanejado();
    const { reenviando, erro: erroReenvio, reenviar } = useReenviarSincronizacao();
    // Guardado com o planoId: trocar de plano/atleta descarta o aviso sem precisar de effect.
    const [ultimoReenvio, setUltimoReenvio] = useState<{ planoId: string; resent: number } | null>(null);
    const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const isAprovado = plano !== null && resolveReviewStatus(plano.reviewStatus) === 'APROVADO';

    const handleReenviar = async () => {
        if (!plano) return;
        setUltimoReenvio(null);
        const resent = await reenviar(plano.planoId);
        if (resent === null) return;
        setUltimoReenvio({ planoId: plano.planoId, resent });
        if (resent > 0) onTreinoEditado?.();
    };

    const abrirEdicao = (t: TreinoPlanejadoResumoDto) => {
        if (!plano) return;
        setErroAoSalvar(null);
        setEditingTreino(toDialogTreino(t, plano.semanaInicio));
    };

    const handleSalvar = async (patch: TreinoPlanejadoPatch) => {
        if (!plano || !editingTreino?.id) return;
        setErroAoSalvar(null);
        try {
            await editarTreino(plano.planoId, editingTreino.id, patch);
        } catch (err) {
            // O dialog continua aberto com as edições (D5).
            setErroAoSalvar(mensagemDeErroAoSalvar(err));
            return;
        }
        const dia = rotuloDiaComData(editingTreino.diaSemana as string, undefined);
        setEditingTreino(null);
        if (isAprovado) {
            setAviso(canal ? `Treino de ${dia} atualizado. Reenviando ao ${NOME_CANAL[canal]}.` : `Treino de ${dia} atualizado.`);
        }
        onTreinoEditado?.();
    };

    if (!plano) {
        return (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <CalendarIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Nenhum plano gerado para esta semana
                </Typography>
                <Button variant="contained" size="small" onClick={onGerarPlano}>
                    Gerar Plano
                </Button>
            </Box>
        );
    }

    const isAguardando = resolveReviewStatus(plano.reviewStatus) === 'AGUARDANDO_REVISAO';
    // `editable` vem do backend (fuso do atleta, relógio); ausente = backend antigo, que só aceita revisão.
    const podeEditar = isAguardando
        ? () => true
        : isAprovado ? (t: TreinoPlanejadoResumoDto) => t.editable === true : undefined;
    const temErroDeEnvio = !isAguardando && plano.treinos.some((t) => isErroSync(t.statusSincronizacao));
    const resentDestePlano = ultimoReenvio?.planoId === plano.planoId ? ultimoReenvio.resent : null;

    return (
        <Stack spacing={1.5}>
            {isAguardando && (
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${semantic.info[500]}`,
                        backgroundColor: `${semantic.info[500]}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <HourglassIcon sx={{ color: semantic.info[500], fontSize: 18 }} />
                        <Typography variant="body2">Plano gerado aguardando revisão</Typography>
                    </Stack>
                    <Button variant="outlined" size="small" onClick={onRevisarPlano}>
                        Revisar
                    </Button>
                </Box>
            )}

            {isAprovado && (
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1}>
                    <Chip
                        icon={<CheckIcon sx={{ fontSize: 16 }} />}
                        label="Aprovado"
                        size="small"
                        sx={{
                            alignSelf: 'flex-start',
                            color: surface[200],
                            bgcolor: alpha(semantic.success[500], 0.12),
                            border: `1px solid ${alpha(semantic.success[500], 0.5)}`,
                            '& .MuiChip-icon': { color: semantic.success[500] },
                        }}
                    />
                    <Typography variant="caption" sx={{ color: surface[400] }}>
                        Treinos pendentes podem ser editados. Realizados ficam travados.
                    </Typography>
                </Stack>
            )}

            {(temErroDeEnvio || resentDestePlano !== null || erroReenvio) && !isAguardando && (
                <ReenvioRelogio
                    treinos={plano.treinos}
                    reenviando={reenviando}
                    erro={erroReenvio}
                    resent={resentDestePlano}
                    onReenviar={() => void handleReenviar()}
                />
            )}

            <TreinosGrid
                treinos={plano.treinos}
                semanaInicio={plano.semanaInicio}
                zones={zones}
                isAguardando={isAguardando}
                podeEditar={podeEditar}
                onEditar={podeEditar ? abrirEdicao : undefined}
            />

            {editingTreino && (
                <TreinoEditDialog
                    open
                    treino={editingTreino}
                    semana={{ inicio: plano.semanaInicio, fim: plano.semanaFim }}
                    atletaId={atletaId}
                    atletaNome={atletaNome}
                    isSaving={isSaving}
                    aviso={isAprovado ? { canal } : undefined}
                    saveErrorMessage={erroAoSalvar}
                    onClose={() => setEditingTreino(null)}
                    onSave={handleSalvar}
                />
            )}

            <Snackbar
                open={Boolean(aviso)}
                autoHideDuration={4000}
                onClose={(_, reason) => { if (reason !== 'clickaway') setAviso(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setAviso(null)}>
                    {aviso}
                </Alert>
            </Snackbar>
        </Stack>
    );
}
