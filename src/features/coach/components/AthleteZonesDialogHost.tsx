import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { GHOST_BTN_SX, PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import { AthleteZonesDialog } from './AthleteZonesDialog';

interface AthleteZonesDialogHostProps {
  open: boolean;
  atletaId: string;
  nomeAtleta?: string;
  onClose: () => void;
  onSalvo?: () => void;
}

function Carregado(props: Omit<AthleteZonesDialogHostProps, 'open'>) {
  const { zones, loading, error, fetchZones } = useAthleteTrainingZones(props.atletaId);

  // O formulário deriva dos valores vigentes na montagem: só abre depois do GET, senão nasce vazio —
  // e, se o GET falhou, abrir vazio deixaria o treinador sobrescrever âncoras que ele não está vendo.
  if (loading) {
    return (
      <CoachDialog open onClose={props.onClose} maxWidth="xs" title="Zonas do atleta">
        <Box role="status" aria-label="Carregando zonas" sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      </CoachDialog>
    );
  }

  if (error) {
    return (
      <CoachDialog
        open
        onClose={props.onClose}
        maxWidth="xs"
        title="Zonas do atleta"
        actions={
          <>
            <Button sx={{ ...GHOST_BTN_SX, minHeight: 44 }} onClick={props.onClose}>
              Fechar
            </Button>
            <Button sx={{ ...PRIMARY_BTN_SX, minHeight: 44 }} variant="contained" onClick={() => void fetchZones()}>
              Tentar de novo
            </Button>
          </>
        }
      >
        <Alert severity="error">Não foi possível carregar as zonas do atleta.</Alert>
      </CoachDialog>
    );
  }

  return <AthleteZonesDialog open zonas={zones} {...props} />;
}

/**
 * Abre o cadastro de zonas para quem não tem as zonas em mãos (ex.: listagem de atletas). O
 * `PlanoDetalhePanel` já tem o hook e usa o `AthleteZonesDialog` direto.
 */
export function AthleteZonesDialogHost({ open, ...resto }: AthleteZonesDialogHostProps) {
  return open ? <Carregado {...resto} /> : null;
}
