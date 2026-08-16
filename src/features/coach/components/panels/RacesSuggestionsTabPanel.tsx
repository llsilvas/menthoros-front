import { Box, Button, Chip, Typography } from '@mui/material';
import { content, primary, semantic, surface } from '../../../../theme/tokens';
import { SectionCard } from '../SectionCard';
import { RecentSuggestionsPanel } from '../RecentSuggestionsPanel';
import { formVariantColor, formVariantLabel } from '../../types/AthleteForm';
import type { CoachAthleteRow } from '../../types/CoachInbox';
import type { AtletaPerfilCoachDto } from '../../../../types/AtletaPerfilCoach';

interface RacesSuggestionsTabPanelProps {
  selected: CoachAthleteRow;
  selectedProfile: AtletaPerfilCoachDto | null;
  onOpenCalendar: () => void;
  onOpenSuggestions: () => void;
}

export function RacesSuggestionsTabPanel({ selected, selectedProfile, onOpenCalendar, onOpenSuggestions }: RacesSuggestionsTabPanelProps) {
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
        {selected.raceCalendar.length === 0 ? (
          <Typography sx={{ fontSize: '0.82rem', color: surface[400] }}>Nenhuma prova cadastrada para este atleta.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 0.85, lg: 0.95, xl: 1.1 } }}>
            {selected.raceCalendar.map((race) => (
              <Box
                key={`${selected.id}-${race.date}`}
                sx={{
                  p: { xs: 0.8, sm: 0.9, lg: 1, xl: 1.2 },
                  borderRadius: 1.5,
                  border: `1px solid ${content.cardBorder}`,
                  backgroundColor: `${surface[0]}06`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.85, sm: 0.95, lg: 1, xl: 1.2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 44, sm: 48, lg: 52, xl: 60 },
                    height: { xs: 44, sm: 48, lg: 52, xl: 60 },
                    borderRadius: 1.5,
                    border: `1px solid ${content.cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${surface[0]}10`,
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', color: surface[400], fontWeight: 700 }}>{race.date.split(' ')[0]}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: surface[200], fontWeight: 700 }}>{race.date.split(' ')[1]}</Typography>
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: { xs: '0.74rem', sm: '0.8rem', lg: '0.84rem', xl: '0.9rem' }, fontWeight: 700, color: surface[50] }} noWrap>
                    {race.label}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.6875rem', sm: '0.6875rem', lg: '0.72rem', xl: '0.78rem' }, color: surface[400] }}>Prova {race.tag.toLowerCase()}</Typography>
                </Box>
                <Chip
                  size="small"
                  label={race.tag}
                  sx={{
                    bgcolor: race.tag === 'ALVO' ? `${semantic.success[500]}14` : race.tag === 'PRINCIPAL' ? `${primary[500]}14` : `${surface[500]}14`,
                    color: race.tag === 'ALVO' ? semantic.success[500] : race.tag === 'PRINCIPAL' ? primary[500] : surface[300],
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

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
        <RecentSuggestionsPanel sugestoes={selectedProfile?.sugestoesRecentes ?? []} onVerTodas={onOpenSuggestions} />
      </SectionCard>
    </Box>
  );
}
