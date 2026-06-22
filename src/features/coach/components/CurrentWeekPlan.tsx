import { useState } from 'react';
import { Box, Button, Grid, IconButton, Stack, Typography } from '@mui/material';
import { CalendarToday as CalendarIcon, HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import type { TreinoPlanejadoDto, TreinoPlanejadoPatch } from '../../../types/PlanoReview';
import { TreinoEditDialog } from './TreinoEditDialog';
import { useEditTreinoPlanejado } from '../../../hooks/useEditTreinoPlanejado';
import { primary, surface, semantic } from '../../../theme/tokens';

interface CurrentWeekPlanProps {
    plano: PlanoVigenteDto | null;
    onGerarPlano: () => void;
    onRevisarPlano: () => void;
    onTreinoEditado?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    REALIZADO:  semantic.success[500],
    CONCLUIDO:  semantic.success[500],
    PENDENTE:   surface[400],
    PERDIDO:    semantic.danger[500],
    PARCIAL:    semantic.warning[400],
    LIVRE:      surface[400],
};

function parseDuracao(iso: string): string | null {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!m) return null;
    const h = parseInt(m[1] ?? '0', 10);
    const mins = parseInt(m[2] ?? '0', 10);
    const total = h * 60 + mins;
    return total > 0 ? `${total} min` : null;
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
    };
}

function TreinoCard({
    treino,
    isAguardando,
    onEditar,
}: {
    treino: TreinoPlanejadoResumoDto;
    isAguardando?: boolean;
    onEditar?: () => void;
}) {
    const statusColor = STATUS_COLORS[treino.statusExecucao] ?? surface[400];
    const duracaoDisplay = treino.duracaoMin ? parseDuracao(treino.duracaoMin) : null;

    return (
        <Box
            sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: surface[800],
                borderLeft: `3px solid ${statusColor}`,
                minWidth: 0,
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                    {treino.diaSemana.slice(0, 3)}
                </Typography>
                {isAguardando && treino.id && onEditar && (
                    <IconButton
                        size="small"
                        onClick={onEditar}
                        aria-label="Editar treino"
                        sx={{ p: 0.25, color: surface[500], '&:hover': { color: primary[400] } }}
                    >
                        <EditOutlinedIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                )}
            </Box>

            <Typography variant="body2" fontWeight={600} noWrap sx={{ mt: 0.25 }}>
                {treino.tipoTreino.replace(/_/g, ' ')}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {treino.distanciaKm.toFixed(1)} km{duracaoDisplay ? ` · ${duracaoDisplay}` : ''}
            </Typography>

            {(treino.zonaAlvo || treino.percepcaoEsforcoEsperada) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {[
                        treino.zonaAlvo,
                        treino.percepcaoEsforcoEsperada ? `RPE ${treino.percepcaoEsforcoEsperada}` : null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </Typography>
            )}
        </Box>
    );
}

function TreinosGrid({
    treinos,
    isAguardando,
    onEditar,
}: {
    treinos: TreinoPlanejadoResumoDto[];
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
    return (
        <Grid container spacing={1}>
            {treinos.map((t) => (
                <Grid key={t.id ?? t.diaSemana} size={{ xs: 6, sm: 4, md: 3, lg: 12 / 7 }}>
                    <TreinoCard
                        treino={t}
                        isAguardando={isAguardando}
                        onEditar={onEditar ? () => onEditar(t) : undefined}
                    />
                </Grid>
            ))}
        </Grid>
    );
}

export function CurrentWeekPlan({ plano, onGerarPlano, onRevisarPlano, onTreinoEditado }: CurrentWeekPlanProps) {
    const [editingTreino, setEditingTreino] = useState<TreinoPlanejadoDto | null>(null);
    const { isSaving, editarTreino } = useEditTreinoPlanejado();

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

    const isAguardando = plano.reviewStatus === 'AGUARDANDO_REVISAO';

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
                isAguardando={isAguardando}
                onEditar={isAguardando ? (t) => setEditingTreino(toDialogTreino(t)) : undefined}
            />

            {editingTreino && (
                <TreinoEditDialog
                    open
                    treino={editingTreino}
                    isSaving={isSaving}
                    onClose={() => setEditingTreino(null)}
                    onSave={handleSalvar}
                />
            )}
        </Stack>
    );
}
