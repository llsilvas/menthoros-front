import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LocalFireDepartment as StreakIcon, Flag as ProvaIcon, Check as CheckIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { primary, surface, semantic } from '../../../theme/tokens';
import type { DiaOverview, WeekOverview } from '../adapters/buildWeekOverview';
import { formatKm } from '../../../utils/formatKm';

export interface WeekOverviewCardProps {
  overview: WeekOverview;
  /** `false` enquanto as provas carregam ou falharam — não sugerir "sem meta" sem saber. */
  provaConhecida?: boolean;
}

function DiaDot({ dia }: { dia: DiaOverview }) {
  const letra = format(dia.date, 'EEEEE', { locale: ptBR }).toUpperCase();
  const base = { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' as const };
  let miolo: React.ReactNode;
  let sx: Record<string, unknown> = { ...base, border: `1px solid ${surface[700]}` };
  if (dia.status === 'concluido') {
    sx = { ...base, bgcolor: alpha(semantic.success[500], 0.18) };
    miolo = <CheckIcon sx={{ fontSize: 14, color: semantic.success[500] }} />;
  } else if (dia.status === 'hoje') {
    sx = { ...base, border: `2px solid ${primary[500]}` };
    miolo = <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dia.color ?? surface[600] }} />;
  } else if (dia.status === 'pulado') {
    miolo = <Box sx={{ width: 10, height: 2, borderRadius: 1, bgcolor: surface[600] }} />;
  } else if (dia.status === 'descanso') {
    miolo = <Box sx={{ width: 10, height: 2, borderRadius: 1, bgcolor: surface[700] }} />;
  } else {
    miolo = <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dia.color ?? surface[600] }} />;
  }
  return (
    <Box data-testid="home-week-day" data-status={dia.status} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="caption" sx={{ color: dia.status === 'hoje' ? primary[500] : surface[500], fontWeight: dia.status === 'hoje' ? 600 : 400 }}>
        {letra}
      </Typography>
      <Box sx={sx}>{miolo}</Box>
    </Box>
  );
}

/** "Sua semana": streak, volume, sete dias e próxima prova — um card no lugar de três (D1). */
export function WeekOverviewCard({ overview, provaConhecida = true }: WeekOverviewCardProps) {
  const { dias, volumeRealizadoKm, volumePlanejadoKm, streak, proximaProva, temPlano } = overview;
  const pct = volumePlanejadoKm ? Math.min(100, (volumeRealizadoKm / volumePlanejadoKm) * 100) : 0;
  const periodo = `${format(dias[0].date, 'd', { locale: ptBR })} – ${format(dias[6].date, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <Box sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, p: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Sua semana</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>{periodo}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.75 }}>
        {dias.map((d) => <DiaDot key={d.iso} dia={d} />)}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: surface[400] }}>Volume</Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            <Box component="strong" sx={{ fontWeight: 600 }}>{formatKm(volumeRealizadoKm)}</Box>
            {volumePlanejadoKm !== null
              ? <Box component="span" sx={{ color: surface[500] }}> / {volumePlanejadoKm} km</Box>
              : <Box component="span" sx={{ color: surface[500] }}> km</Box>}
          </Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: surface[700], overflow: 'hidden' }}>
          <Box sx={{ width: `${pct}%`, height: 6, borderRadius: 3, bgcolor: primary[500], transition: 'width 0.4s ease' }} />
        </Box>
        {!temPlano && (
          <Typography variant="caption" sx={{ color: surface[500] }}>Sem plano aprovado para esta semana — o volume é o que você registrou.</Typography>
        )}
      </Box>

      <Box sx={{ height: 1, bgcolor: surface[700] }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box data-testid="home-streak" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StreakIcon sx={{ color: streak > 0 ? primary[500] : surface[600], fontSize: 18 }} />
          <Typography variant="body2">
            {streak > 0
              ? <><Box component="strong" sx={{ fontWeight: 600 }}>{streak} {streak === 1 ? 'semana' : 'semanas'}</Box> <Box component="span" sx={{ color: surface[400] }}>{streak === 1 ? 'seguida' : 'seguidas'} treinando</Box></>
              : <Box component="span" sx={{ color: surface[400] }}>Sem sequência ainda — todo treino conta.</Box>}
          </Typography>
        </Box>
        <Box data-testid="home-next-race" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ProvaIcon sx={{ color: proximaProva ? primary[500] : surface[600], fontSize: 18 }} />
          <Typography variant="body2">
            {proximaProva
              ? (proximaProva.diasFaltando != null
                  ? <><Box component="span" sx={{ color: surface[400] }}>{proximaProva.nomeProva} em</Box> <Box component="strong" sx={{ fontWeight: 600 }}>{proximaProva.diasFaltando} {proximaProva.diasFaltando === 1 ? 'dia' : 'dias'}</Box></>
                  : <>Sua próxima meta: {proximaProva.nomeProva}</>)
              : provaConhecida
                ? <Box component="span" sx={{ color: surface[400] }}>Sem próxima meta — peça ao seu coach para cadastrar sua próxima prova.</Box>
                : <Box component="span" sx={{ color: surface[500] }}>Próxima prova indisponível no momento.</Box>}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default WeekOverviewCard;
