import { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { content, surface } from '../../../../theme/tokens';
import { SectionCard } from '../SectionCard';
import { RecentSuggestionsPanel } from '../RecentSuggestionsPanel';
import { AthleteRacesPanel } from '../AthleteRacesPanel';
import { useCoachAthleteRaces } from '../../hooks/useCoachAthleteRaces';
import { buildCoachRaceList } from '../../adapters/coachRaceAdapters';
import { formVariantColor, formVariantLabel } from '../../types/AthleteForm';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { AtletaPerfilCoachDto } from '../../../../types/AtletaPerfilCoach';

interface RacesSuggestionsTabPanelProps {
  selected: CoachAthleteRow;
  selectedProfile: AtletaPerfilCoachDto | null;
  onOpenCalendar: () => void;
  onOpenSuggestions: () => void;
  onDecisao?: () => void;
  /** Chamado após a ciência ser registrada, para a página recarregar a fila de atenção. */
  onCienteRegistrado?: (atletaId: string) => void;
}

export function RacesSuggestionsTabPanel({ selected, selectedProfile, onOpenCalendar, onOpenSuggestions, onDecisao, onCienteRegistrado }: RacesSuggestionsTabPanelProps) {
  const { provas, pendentes, loading, acting, error, fetchRaces, marcarCiente } = useCoachAthleteRaces(selected.id);
  const races = useMemo(() => buildCoachRaceList(provas, pendentes), [provas, pendentes]);

  async function handleCiente(provaId: string) {
    try {
      await marcarCiente(provaId);
    } catch {
      // o erro já fica exposto pelo hook e renderizado no painel
      return;
    }
    onCienteRegistrado?.(selected.id);
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1.1fr' }, gap: { xs: 0.9, sm: 1, lg: 1.1, xl: 2 } }}>
      <SectionCard
        title="Provas do atleta"
        action={
          <Button size="small" sx={{ textTransform: 'none' }} onClick={onOpenCalendar}>
            Ver calendário completo
          </Button>
        }
      >
        <AthleteRacesPanel
          races={races}
          loading={loading}
          error={error}
          acting={acting}
          onCiente={handleCiente}
          onRetry={() => { void fetchRaces(); }}
        />

        {selected.racePrediction && (
          <Box sx={{ mt: 1.5, p: 1.5, border: `1px solid ${content.cardBorder}`, borderRadius: 2, backgroundColor: `${surface[0]}06` }}>
            <Typography sx={{ fontSize: '0.6875rem', color: surface[400], textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
              Previsão de forma · em {selected.racePrediction.diasAteProva} dias
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: formVariantColor[selected.racePrediction.formaPrevista] }}>
                {formVariantLabel[selected.racePrediction.formaPrevista]}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: surface[400] }}>
                TSB previsto: {selected.racePrediction.tsbPrevisto >= 0 ? '+' : ''}{selected.racePrediction.tsbPrevisto}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.6875rem', color: surface[500], mt: 0.5 }}>
              Estimativa com taper completo (sem carga)
            </Typography>
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Sugestões recentes">
        <RecentSuggestionsPanel
          sugestoes={selectedProfile?.sugestoesRecentes ?? []}
          onVerTodas={onOpenSuggestions}
          onDecisao={onDecisao}
        />
      </SectionCard>
    </Box>
  );
}
