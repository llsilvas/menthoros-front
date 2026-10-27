import { useState } from 'react';
import { Box, Button, Grid, IconButton, Stack, Typography } from '@mui/material';
import { CalendarToday as CalendarIcon, HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';
import { resolveReviewStatus } from '../../../types/PlanoReview';
import { TreinoEditDialog } from './TreinoEditDialog';
import { useTreinoPlanejado } from '../../../hooks/useTreinoPlanejado';
import { surface, semantic, primary } from '../../../theme/tokens';
import { SyncStatusChip } from './SyncStatusChip';
import { TreinoPlanejadoCard } from './TreinoPlanejadoCard';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { buildIntensityLineFromTreino } from '../adapters/buildIntensityLine';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { estadoDeExecucao } from './treinoPlanejadoEstado';
import { rotuloDiaComData, tipoTreinoLabel } from './tiposTreino';
import { duracaoEmMinutos } from '../adapters/duracaoTreino';
import { indiceDoDia, weekDatesFromInicio } from '../../../utils/semana';

interface CurrentWeekPlanProps {
    plano: PlanoVigenteDto | null;
    /** Atleta dono do plano; habilita as zonas (pace/FC) nos cards. */
    atletaId?: string;
    onGerarPlano: () => void;
    onRevisarPlano: () => void;
    onTreinoEditado?: () => void;
}

function toDialogTreino(t: TreinoPlanejadoResumoDto): TreinoPlanejadoDto {
    return {
        id: t.id,
        diaSemana: t.diaSemana,
        tipoTreino: t.tipoTreino,
        distanciaKm: t.distanciaKm,
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
    onEditar,
}: {
    treino: TreinoPlanejadoResumoDto;
    zones: AthleteTrainingZonesDto | null;
    /** Data do dia na semana do plano; `undefined` quando o dia não é reconhecido. */
    data?: Date;
    isAguardando?: boolean;
    onEditar?: () => void;
}) {
    const mostraSync = !isAguardando
        && (treino.statusSincronizacao !== undefined || treino.atletaConectadoIntervalsIcu !== undefined);

    return (
        <TreinoPlanejadoCard
            dia={rotuloDiaComData(treino.diaSemana, data)}
            tipoTreino={treino.tipoTreino}
            rotulo={tipoTreinoLabel(treino.tipoTreino)}
            distanciaKm={treino.distanciaKm}
            duracaoMin={duracaoEmMinutos(treino.duracaoMin)}
            rpeEsperado={treino.percepcaoEsforcoEsperada}
            zonaAlvo={treino.zonaAlvo}
            intensidade={buildIntensityLineFromTreino(treino.etapas, zones)}
            tssPlanejado={treino.tssPlanejado}
            estado={estadoDeExecucao(treino.statusExecucao)}
            actions={isAguardando && treino.id && onEditar ? (
                <IconButton
                    size="small"
                    onClick={onEditar}
                    aria-label="Editar treino"
                    sx={{ p: 0.5, color: surface[400], '&:hover': { color: primary[400] } }}
                >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
            ) : undefined}
            rodape={mostraSync ? (
                <SyncStatusChip
                    statusSincronizacao={treino.statusSincronizacao}
                    atletaConectado={treino.atletaConectadoIntervalsIcu}
                />
            ) : undefined}
        />
    );
}

function TreinosGrid({
    treinos,
    semanaInicio,
    zones,
    isAguardando,
    onEditar,
}: {
    treinos: TreinoPlanejadoResumoDto[];
    zones: AthleteTrainingZonesDto | null;
    semanaInicio: string;
    isAguardando?: boolean;
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
        // forçava 7 cards/linha (1 por dia da semana) e truncava "CONTÍNUO"/"No intervals.icu".
        <Grid container spacing={1}>
            {treinos.map((t) => (
                <Grid key={t.id ?? t.diaSemana} size={{ xs: 12, sm: 6 }}>
                    <TreinoCard
                        treino={t}
                        zones={zones}
                        data={indiceDoDia(t.diaSemana) >= 0 ? datasDaSemana[indiceDoDia(t.diaSemana)] : undefined}
                        isAguardando={isAguardando}
                        onEditar={onEditar ? () => onEditar(t) : undefined}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

export function CurrentWeekPlan({ plano, atletaId, onGerarPlano, onRevisarPlano, onTreinoEditado }: CurrentWeekPlanProps) {
    const { zones } = useAthleteTrainingZones(atletaId);
    const [editingTreino, setEditingTreino] = useState<TreinoPlanejadoDto | null>(null);
    const { isSaving, editarTreino } = useTreinoPlanejado();

    const handleSalvar = async (patch: TreinoPlanejadoPatch) => {
        if (!plano || !editingTreino?.id) return;
        await editarTreino(plano.planoId, editingTreino.id, patch);
        setEditingTreino(null);
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

            <TreinosGrid
                treinos={plano.treinos}
                semanaInicio={plano.semanaInicio}
                zones={zones}
                isAguardando={isAguardando}
                onEditar={isAguardando ? (t) => setEditingTreino(toDialogTreino(t)) : undefined}
            />

            {editingTreino && (
                <TreinoEditDialog
                    open
                    treino={editingTreino}
                    atletaId={atletaId}
                    isSaving={isSaving}
                    onClose={() => setEditingTreino(null)}
                    onSave={handleSalvar}
                />
            )}
        </Stack>
    );
}
