import { Box, Typography } from '@mui/material';
import { glassSx, surface } from '../../../theme/tokens';
import type { WeeklySummary } from '../adapters/buildWeeklySummary';

export interface WeeklySummaryCardProps {
  resumo: WeeklySummary;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
      <Typography sx={{ color: surface[500], fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ color: surface[50], fontSize: '1rem', fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

export function WeeklySummaryCard({ resumo }: WeeklySummaryCardProps) {
  return (
    <Box sx={{ ...glassSx, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ color: surface[50], fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Seu resumo da semana
      </Typography>

      {resumo.totalTreinos === 0 ? (
        <Typography sx={{ color: surface[400], fontSize: '0.9rem' }}>
          Você ainda não registrou treinos esta semana — todo treino conta!
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 1.5 }}>
          <Item label="Treinos" value={`${resumo.totalTreinos}`} />
          <Item label="Volume" value={`${resumo.volumeTotalKm.toFixed(1)} km`} />
          <Item label="Streak" value={`${resumo.streak} ${resumo.streak === 1 ? 'semana' : 'semanas'}`} />
          <Item label="Forma" value={resumo.formaAtual} />
          {resumo.proximoTreino && <Item label="Próximo" value={resumo.proximoTreino} />}
        </Box>
      )}
    </Box>
  );
}

export default WeeklySummaryCard;
