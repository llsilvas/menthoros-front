import { Box, Chip, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TreinoRealizadoDto } from '../../../types/TreinoManual';
import { TIPO_TREINO_LABELS } from '../../../types/TreinoManual';
import { glassSx, surface, primary } from '../../../theme/tokens';

interface RecentTrainingsListProps {
    treinos: TreinoRealizadoDto[];
}

function duracaoLabel(duracaoMin: string): string {
    const parts = duracaoMin.split(':').map(Number);
    if (parts.length === 3 && (parts[0] > 0)) {
        return `${parts[0]}h${parts[1].toString().padStart(2, '0')}`;
    }
    const totalMin = parts.length === 3
        ? parts[0] * 60 + parts[1]
        : parts[0];
    return `${totalMin} min`;
}

export function RecentTrainingsList({ treinos }: RecentTrainingsListProps) {
    if (treinos.length === 0) {
        return (
            <Box
                sx={{
                    ...glassSx,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                }}
            >
                <Typography sx={{ color: surface[400], fontSize: '0.9rem' }}>
                    Nenhum treino registrado nos últimos 7 dias.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {treinos.map((t) => (
                <Box
                    key={t.id}
                    sx={{
                        ...glassSx,
                        borderRadius: 2,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* Linha superior: tipo + data + badge Manual */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: surface[50], fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>
                            {TIPO_TREINO_LABELS[t.tipoTreino] ?? t.tipoTreino}
                        </Typography>
                        <Chip
                            label="Manual"
                            size="small"
                            sx={{
                                bgcolor: 'rgba(212,255,58,0.12)',
                                color: primary[500],
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 20,
                            }}
                        />
                        <Typography sx={{ color: surface[400], fontSize: '0.78rem' }}>
                            {format(parseISO(t.dataTreino), "d 'de' MMM", { locale: ptBR })}
                        </Typography>
                    </Box>

                    {/* Linha inferior: métricas */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <MetricChip label="Duração" value={duracaoLabel(t.duracaoMin)} />
                        {t.distanciaKm != null && (
                            <MetricChip label="Dist." value={`${t.distanciaKm} km`} />
                        )}
                        {t.percepcaoEsforco != null && (
                            <MetricChip label="RPE" value={String(t.percepcaoEsforco)} />
                        )}
                        {t.tssCalculado != null && (
                            <MetricChip label="TSS" value={String(t.tssCalculado)} />
                        )}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

function MetricChip({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Typography sx={{ color: surface[400], fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {label}
            </Typography>
            <Typography sx={{ color: surface[200], fontSize: '0.85rem', fontWeight: 700 }}>
                {value}
            </Typography>
        </Box>
    );
}
