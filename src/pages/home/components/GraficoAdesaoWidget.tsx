import { useEffect, useState } from 'react';
import { CircularProgress, Paper, Typography } from '@mui/material';
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
import { MetricasService } from '../../../services/MetricasService';
import type { AdesaoDiaria } from '../../../types/Metricas';
import { glassAzulSx, glassAzulSxHover, transitions, primary, surface } from '../../../theme/tokens';
import { overlayWhite } from '../../../theme/overlays';

interface ChartDataPoint {
  dia: string;
  [key: string]: string | number;
}

const diasSemanaLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const transformarDadosParaGrafico = (adesaoDiaria: AdesaoDiaria): ChartDataPoint[] => {
  if (!adesaoDiaria.semanas || adesaoDiaria.semanas.length === 0) {
    return [];
  }

  const mapDiaParaIndice: Record<string, number> = {
    DOM: 0,
    SEG: 1,
    TER: 2,
    QUA: 3,
    QUI: 4,
    SEX: 5,
    SAB: 6,
  };

  const chartData: ChartDataPoint[] = Array(7)
    .fill(null)
    .map((_, i) => ({
      dia: diasSemanaLabels[i],
    }));

  adesaoDiaria.semanas.forEach((semana, semanaIndex) => {
    const labelSemana = semanaIndex === adesaoDiaria.semanas.length - 1 ? 'Semana atual' : `Sem -${adesaoDiaria.semanas.length - 1 - semanaIndex}`;

    semana.dias.forEach((dia) => {
      const indice = mapDiaParaIndice[dia.diaSemana];
      if (indice !== undefined) {
        chartData[indice][labelSemana] = dia.percentual;
      }
    });
  });

  return chartData;
};

export default function GraficoAdesaoWidget() {
  const [adesaoDiaria, setAdesaoDiaria] = useState<AdesaoDiaria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MetricasService.getAdesaoDiariaAssessoria()
      .then(setAdesaoDiaria)
      .catch((err) => {
        console.error('Erro ao carregar adesão diária:', err);
        setError('Não foi possível carregar os dados');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 1,
          ...glassAzulSx,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (error || !adesaoDiaria) {
    return (
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 1,
          ...glassAzulSx,
        }}
      >
        <Typography sx={{ color: overlayWhite[70] }}>
          {error || 'Sem dados disponíveis'}
        </Typography>
      </Paper>
    );
  }

  const chartData = transformarDadosParaGrafico(adesaoDiaria);

  if (chartData.length === 0) {
    return (
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 1,
          ...glassAzulSx,
        }}
      >
        <Typography sx={{ color: overlayWhite[70] }}>
          Sem dados de treinos para exibir
        </Typography>
      </Paper>
    );
  }

  const semanaAtualIndex = adesaoDiaria.semanas.length - 1;
  const cores = [
    primary[500],
    `${primary[500]}80`,
    `${primary[500]}66`,
    `${primary[500]}4D`,
    `${primary[500]}33`,
  ];

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
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: surface[0],
          mb: 2,
          fontSize: '1rem',
        }}
      >
        Adesão por Dia - Assessoria
      </Typography>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={overlayWhite[8]} />
          <XAxis
            dataKey="dia"
            stroke={overlayWhite[60]}
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke={overlayWhite[60]}
            style={{ fontSize: '0.75rem' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: surface[700],
              border: 'none',
              borderRadius: 4,
              color: surface[50],
            }}
            labelStyle={{ color: surface[50] }}
            formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : value}%`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '0.875rem' }}
            iconType="line"
          />

          {adesaoDiaria.semanas.map((_, index) => {
            const labelSemana = index === semanaAtualIndex ? 'Semana atual' : `Sem -${semanaAtualIndex - index}`;
            const strokeWidth = index === semanaAtualIndex ? 2.5 : 1.5;
            const cor = cores[index] || `${primary[500]}33`;

            return (
              <Line
                key={labelSemana}
                type="monotone"
                dataKey={labelSemana}
                stroke={cor}
                strokeWidth={strokeWidth}
                dot={false}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
