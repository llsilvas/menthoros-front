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
import { glassAzulSx, glassAzulSxHover, transitions } from '../../../theme/tokens';

interface ProjecaoEvolutionChartProps {
    atletaId: string;
    provaId: string;
}

interface ChartPoint {
    date: string;
    [key: string]: string | number | undefined;
}

const LINE_COLORS = ['#b1e92d', '#3498db', '#e74c3c', '#f39c12'];

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
                <CircularProgress size={24} sx={{ color: '#b1e92d' }} />
            </Paper>
        );
    }

    if (chartData.length < 2) {
        return (
            <Paper sx={{ p: 2.5, borderRadius: 1, ...glassAzulSx }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 1, fontSize: '1rem' }}>
                    Evolução das Projeções Oficiais
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
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

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ bgcolor: 'rgba(8,33,48,0.95)', border: '1px solid rgba(177,233,45,0.3)', borderRadius: 1, p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                {payload.map((entry: any) => {
                    const dist = parseInt(entry.dataKey.replace('dist_', ''), 10);
                    const prevIdx = chartData.findIndex(p => p.date === label) - 1;
                    const prevVal = prevIdx >= 0 ? (chartData[prevIdx][entry.dataKey] as number) : undefined;
                    const delta = prevVal != null ? (entry.value as number) - prevVal : undefined;
                    return (
                        <Box key={entry.dataKey} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>
                                {formatDistanceLabel(dist)}: {formatSeconds(entry.value as number)}
                            </Typography>
                            {delta != null && (
                                <Typography variant="caption" sx={{ color: delta < 0 ? '#b1e92d' : '#e74c3c', fontWeight: 700 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 2, fontSize: '1rem' }}>
                Evolução das Projeções Oficiais
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                        tickLine={false}
                        reversed
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => {
                            const dist = parseInt(value.replace('dist_', ''), 10);
                            return <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{formatDistanceLabel(dist)}</span>;
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
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>
                Y invertido: menor = mais rápido. Verde = melhora.
            </Typography>
        </Paper>
    );
};

export default ProjecaoEvolutionChart;
