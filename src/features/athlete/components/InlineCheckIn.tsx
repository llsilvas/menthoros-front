import { Alert, Box, Button, Typography } from '@mui/material';
import {
  Bedtime as SonoIcon,
  SentimentSatisfiedAlt as HumorIcon,
  Healing as DoresIcon,
  Bolt as EnergiaIcon,
  Spa as EstresseIcon,
} from '@mui/icons-material';
import { elevation } from '../../../shared/design-tokens';
import { radius } from '../../../shared/design-tokens/density';
import { surface, semantic } from '../../../theme/tokens';
import { CHECKIN_ITENS, type CheckinItemKey, type NivelInline, type SelecaoInline } from '../adapters/inlineCheckinMapping';

export interface InlineCheckInProps {
  selecao: SelecaoInline;
  pendentes: number;
  salvo: boolean;
  salvando: boolean;
  error: Error | null;
  onSelecionar: (key: CheckinItemKey) => void;
  /** Abre o `QuickCheckInModal` para quem quer os sliders 1–10. */
  onMaisDetalhes: () => void;
}

const ICONES: Record<CheckinItemKey, typeof SonoIcon> = {
  qualidadeSono: SonoIcon, humor: HumorIcon, doresMusculares: DoresIcon, nivelEnergia: EnergiaIcon, estresse: EstresseIcon,
};

// Nível na leitura do atleta: 3 = bom, 2 = médio, 1 = ruim — a cor segue a leitura, não a escala do DTO.
const COR_NIVEL: Record<NivelInline, string> = { 3: semantic.success[500], 2: semantic.warning[500], 1: semantic.danger[500] };

/** Check-in de prontidão em cinco toques, sem modal (design D2). Cada alvo cicla ruim → médio → bom. */
export function InlineCheckIn({ selecao, pendentes, salvo, salvando, error, onSelecionar, onMaisDetalhes }: InlineCheckInProps) {
  const total = CHECKIN_ITENS.length;
  const feitos = total - pendentes;

  return (
    <Box sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, p: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h6">Como você acordou?</Typography>
        <Typography variant="caption" sx={{ color: surface[500] }}>toque para mudar</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.75 }}>
        {CHECKIN_ITENS.map((item) => {
          const nivel = selecao[item.key];
          const Icone = ICONES[item.key];
          const cor = nivel === null ? surface[600] : COR_NIVEL[nivel];
          return (
            <Box key={item.key} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <Box
                component="button"
                type="button"
                aria-label={item.label}
                aria-pressed={nivel !== null}
                disabled={salvando}
                onClick={() => onSelecionar(item.key)}
                sx={{
                  width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', p: 0,
                  border: `2px solid ${cor}`,
                  bgcolor: nivel === null ? 'transparent' : `${cor}29`,
                  color: cor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  '&:focus-visible': { outline: `2px solid ${surface[50]}`, outlineOffset: 2 },
                  '&:disabled': { cursor: 'default', opacity: 0.7 },
                }}
              >
                <Icone sx={{ fontSize: 22, color: 'inherit' }} />
              </Box>
              <Typography variant="caption" sx={{ color: surface[300], fontWeight: 500 }}>{item.label}</Typography>
              <Typography variant="caption" sx={{ color: cor, lineHeight: 1 }}>
                {nivel === null ? '—' : item.niveis[nivel - 1]}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {error && (
        <Alert severity="warning" variant="outlined">Não foi possível salvar seu check-in. Tente de novo.</Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: salvo ? semantic.success[500] : surface[500] }}>
          {salvando ? 'Salvando…' : salvo ? 'Salvo' : `${feitos} de ${total}`}
        </Typography>
        <Button size="small" onClick={onMaisDetalhes} sx={{ minHeight: 44 }}>Mais detalhes</Button>
      </Box>
    </Box>
  );
}

export default InlineCheckIn;
