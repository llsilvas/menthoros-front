import { Box, Chip, Link, Typography } from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { primary, semantic, surface } from '../../../theme/tokens';
import { ROUTES } from '../../../constants/routes';
import type { Prova } from '../../../types/Prova';
import { countUpcomingRaces, selectTargetRace } from '../adapters/raceAdapters';

export interface RaceTargetBannerProps {
  provas: Prova[];
  /** `true` enquanto as provas carregam — a faixa não afirma "nenhuma prova" sem saber. */
  loading?: boolean;
  error?: Error | null;
  hoje?: Date;
}

/**
 * Faixa da prova-alvo no topo do Plano — a entrada para "Minhas provas" (não há item no menu,
 * design D7). Três estados: alvo definida, provas sem alvo, nenhuma prova.
 *
 * Os links levam `variant="body2"`: com `inherit` herdariam a fonte do `body` (Syne, do tema
 * global) em vez da fonte de texto do shell do atleta.
 */
export function RaceTargetBanner({ provas, loading = false, error = null, hoje }: RaceTargetBannerProps) {
  if (loading || error) return null;

  const alvo = selectTargetRace(provas, hoje);
  const futuras = countUpcomingRaces(provas, hoje);

  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 2,
    py: 1.5,
    borderRadius: radius.lg,
    bgcolor: elevation.card,
    border: `1px solid ${surface[700]}`,
  };

  if (alvo) {
    return (
      <Box data-testid="race-target-banner" data-state="alvo" sx={{ ...base, borderColor: `${primary[500]}55` }}>
        <FlagIcon sx={{ color: primary[500], fontSize: 22 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ color: primary[500], fontWeight: 700, letterSpacing: 0.5 }}>PROVA-ALVO</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: surface[50] }} noWrap>{alvo.nome}</Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            {alvo.dataLabel} · {alvo.distanciaLabel} · faltam {alvo.semanasFaltando} {alvo.semanasFaltando === 1 ? 'semana' : 'semanas'}
            {alvo.semanasMinimas != null ? ` de ${alvo.semanasMinimas}` : ''}
          </Typography>
          {alvo.preparacaoCurta && (
            <Chip size="small" label="Preparação curta" sx={{ mt: 0.5, bgcolor: `${semantic.warning[500]}22`, color: semantic.warning[500], fontWeight: 600 }} />
          )}
        </Box>
        <Link component={RouterLink} variant="body2" to={ROUTES.ATHLETE_RACES} sx={{ color: primary[500], fontWeight: 600, whiteSpace: 'nowrap' }}>
          Minhas provas
        </Link>
      </Box>
    );
  }

  if (futuras > 0) {
    return (
      <Box data-testid="race-target-banner" data-state="sem-alvo" sx={base}>
        <FlagIcon sx={{ color: surface[500], fontSize: 22 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: surface[50] }}>Nenhuma prova-alvo</Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Você tem {futuras} {futuras === 1 ? 'prova cadastrada' : 'provas cadastradas'}. Escolha a que orienta o seu plano.
          </Typography>
        </Box>
        <Link component={RouterLink} variant="body2" to={ROUTES.ATHLETE_RACES} sx={{ color: primary[500], fontWeight: 600, whiteSpace: 'nowrap' }}>
          Escolher
        </Link>
      </Box>
    );
  }

  return (
    <Box data-testid="race-target-banner" data-state="vazio" sx={base}>
      <FlagIcon sx={{ color: surface[500], fontSize: 22 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, color: surface[50] }}>Nenhuma prova cadastrada</Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>A prova-alvo orienta o plano das próximas semanas.</Typography>
      </Box>
      <Link component={RouterLink} variant="body2" to={ROUTES.ATHLETE_RACE_NEW} sx={{ color: primary[500], fontWeight: 600, whiteSpace: 'nowrap' }}>
        Cadastrar prova
      </Link>
    </Box>
  );
}

export default RaceTargetBanner;
