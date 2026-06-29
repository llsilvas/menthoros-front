import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useRaceProjection } from '../../../hooks/useRaceProjection';
import {
    formatDistanceLabel,
    formatSeconds,
} from '../../../types/RaceProjection';
import { alpha } from '@mui/material/styles';
import { glassAzulSx, glassAzulSxHover, transitions, primary, surface, semantic } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';

interface ProjecaoEvolutionChartProps {
    atletaId: string;
    provaId: string;
}

interface ChartPoint {
    date: string;
    [key: string]: string | number | undefined;
}

interface TooltipEntry {
    dataKey?: string | number;
    color?: string;
    value?: string | number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string | number;
}

const LINE_COLORS = [primary[500], semantic.info[500], semantic.danger[500], semantic.warning[500]];

const ProjecaoEvolutionChart: React.FC<ProjecaoEvolutionChartProps> = ({ atletaId, provaId }) => {
    const { historico, loading, fetchHistorico } = useRaceProjection();
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [distances, setDistances] = useState<number[]>([]);

    useEffect(() => {
        fetchHistorico(atletaId, provaId);
    }, [atletaId, provaId, fetchHistorico]);

    useEffect(() => {
        const official = historico.filter(s => s.isOfficial && s.coachReviewedAt);
        if (official.length === 0) {
            setChartData([]);
            setDistances([]);
            return;
        }

        // Collect all distinct distances across snapshots
        const distSet = new Set<number>();
        official.forEach(s => {
            Object.keys(s.projections).forEach(k => distSet.add(parseInt(k, 10)));
        });
        const sortedDists = Array.from(distSet).sort((a, b) => a - b);
        setDistances(sortedDists);

        const points: ChartPoint[] = official
            .slice()
            .sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime())
            .map(s => {
                const point: ChartPoint = {
                    date: new Date(s.generatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                };
                sortedDists.forEach(dist => {
                    const proj = s.projections[String(dist)];
                    if (proj) {
                        point[`dist_${dist}`] = proj.projectedTimeSeconds;
                    }
                });
                return point;
            });

        setChartData(points);
    }, [historico]);

    if (loading) {
        return (
            <Paper sx={{ p: 2.5, borderRadius: 1, ...glassAzulSx }}>
                <CircularProgress size={24} sx={{ color: primary[500] }} />
            </Paper>
        );
    }

    if (chartData.length < 2) {
        return (
            <Paper sx={{ p: 2.5, borderRadius: 1, ...glassAzulSx }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: surface[0], mb: 1, fontSize: '1rem' }}>
                    Evolução das Projeções Oficiais
                </Typography>
                <Typography variant="body2" sx={{ color: overlayWhite[60] }}>
                    {historico.filter(s => s.isOfficial).length === 0
                        ? 'Nenhuma projeção oficial ainda'
                        : 'Necessário ao menos 2 projeções oficiais para exibir o gráfico'}
                </Typography>
            </Paper>
        );
    }

    const formatYAxis = (value: number) => {
        const m = Math.floor(value / 60);
        const h = Math.floor(m / 60);
        const rem = m % 60;
        if (h > 0) return `${h}h${String(rem).padStart(2, '0')}`;
        return `${m}min`;
    };

    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ bgcolor: alpha(surface[900], 0.95), border: `1px solid ${alpha(primary[500], 0.3)}`, borderRadius: 1, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: overlayWhite[70], display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                {payload.map((entry) => {
                    const dataKey = String(entry.dataKey ?? '');
                    const dist = parseInt(dataKey.replace('dist_', ''), 10);
                    const prevIdx = chartData.findIndex(p => p.date === label) - 1;
                    const prevVal = prevIdx >= 0 ? (chartData[prevIdx][dataKey] as number) : undefined;
                    const value = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
                    const delta = prevVal != null ? value - prevVal : undefined;
                    return (
                        <Box key={dataKey} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: surface[0], fontWeight: 700 }}>
                                {formatDistanceLabel(dist)}: {formatSeconds(value)}
                            </Typography>
                            {delta != null && (
                                <Typography variant="caption" sx={{ color: delta < 0 ? primary[500] : semantic.danger[500], fontWeight: 700 }}>
                                    ({delta < 0 ? '' : '+'}{formatSeconds(Math.abs(delta))})
                                </Typography>
                            )}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 1,
                ...glassAzulSx,
                '&:hover': glassAzulSxHover,
                transition: transitions.default,
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 700, color: surface[0], mb: 2, fontSize: '1rem' }}>
                Evolução das Projeções Oficiais
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={overlayWhite[10]} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: overlayWhite[70], fontSize: 11 }}
                        axisLine={{ stroke: overlayWhite[20] }}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        tick={{ fill: overlayWhite[70], fontSize: 11 }}
                        axisLine={{ stroke: overlayWhite[20] }}
                        tickLine={false}
                        reversed
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => {
                            const dist = parseInt(value.replace('dist_', ''), 10);
                            return <span style={{ color: overlayWhite[80], fontSize: 11 }}>{formatDistanceLabel(dist)}</span>;
                        }}
                    />
                    {distances.map((dist, i) => (
                        <Line
                            key={dist}
                            type="monotone"
                            dataKey={`dist_${dist}`}
                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                            strokeWidth={2}
                            dot={{ fill: LINE_COLORS[i % LINE_COLORS.length], r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            <Typography variant="caption" sx={{ color: overlayWhite[50], mt: 1, display: 'block' }}>
                Y invertido: menor = mais rápido. Verde = melhora.
            </Typography>
        </Paper>
    );
};

export default ProjecaoEvolutionChart;
