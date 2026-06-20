import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { CalendarToday as CalendarIcon, HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import type { PlanoVigenteDto, TreinoPlanejadoResumoDto } from '../../../types/AtletaPerfilCoach';
import { surface, semantic } from '../../../theme/tokens';

interface CurrentWeekPlanProps {
    plano: PlanoVigenteDto | null;
    onGerarPlano: () => void;
    onRevisarPlano: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    REALIZADO:  semantic.success[500],
    CONCLUIDO:  semantic.success[500],
    PENDENTE:   surface[400],
    PERDIDO:    semantic.danger[500],
    PARCIAL:    semantic.warning[400],
    LIVRE:      surface[400],
};

function TreinoCard({ treino }: { treino: TreinoPlanejadoResumoDto }) {
    const statusColor = STATUS_COLORS[treino.statusExecucao] ?? surface[400];
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
            <Typography variant="caption" color="text.secondary" noWrap>
                {treino.diaSemana.slice(0, 3)}
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap>
                {treino.tipoTreino.replace(/_/g, ' ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {treino.distanciaKm.toFixed(1)} km
            </Typography>
        </Box>
    );
}

export function CurrentWeekPlan({ plano, onGerarPlano, onRevisarPlano }: CurrentWeekPlanProps) {
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

    if (plano.reviewStatus === 'AGUARDANDO_REVISAO') {
        return (
            <Box
                sx={{
                    p: 2,
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
                    <HourglassIcon sx={{ color: semantic.info[500], fontSize: 20 }} />
                    <Typography variant="body2">Plano gerado aguardando revisão</Typography>
                </Stack>
                <Button variant="outlined" size="small" onClick={onRevisarPlano}>
                    Revisar
                </Button>
            </Box>
        );
    }

    return (
        <Grid container spacing={1}>
            {plano.treinos.map((t) => (
                <Grid key={t.diaSemana} size={{ xs: 6, sm: 4, md: 3, lg: 12 / 7 }}>
                    <TreinoCard treino={t} />
                </Grid>
            ))}
            {plano.treinos.length === 0 && (
                <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">
                        Plano aprovado sem treinos detalhados
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
}
