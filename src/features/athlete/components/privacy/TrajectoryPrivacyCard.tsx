import { useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Skeleton, Switch, Typography } from '@mui/material';
import { surface } from '../../../../theme/tokens';
import { elevation } from '../../../../shared/design-tokens';
import { radius } from '../../../../shared/design-tokens/density';
import { useTrajectoryShareConsent } from '../../hooks/useTrajectoryShareConsent';
import { TrajectoryShareConsentDialog } from './TrajectoryShareConsentDialog';

/**
 * Seção "Privacidade" do perfil: onde o atleta revoga (ou concede) o trajeto nos cards (D6, CA7).
 * Ligar abre o mesmo aviso do compartilhamento — nunca há concessão sem o texto.
 */
export function TrajectoryPrivacyCard() {
  const consent = useTrajectoryShareConsent();
  const [avisoAberto, setAvisoAberto] = useState(false);

  const alternar = async (ligar: boolean) => {
    consent.limparErro();
    if (ligar) setAvisoAberto(true);
    else await consent.revogar();
  };

  const confirmar = async () => {
    if (await consent.confirmar()) setAvisoAberto(false);
  };

  return (
    <Box component="section" aria-labelledby="privacidade-titulo"
      sx={{ bgcolor: elevation.card, border: `1px solid ${surface[700]}`, borderRadius: radius.lg, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography id="privacidade-titulo" variant="subtitle1" sx={{ fontWeight: 700 }}>Privacidade</Typography>
      {consent.loading ? (
        <Skeleton variant="rounded" height={44} />
      ) : consent.loadError ? (
        <Alert severity="error" action={<Button color="inherit" onClick={() => void consent.fetchConsent()}>Tentar de novo</Button>}>
          Não deu para carregar esta preferência.
        </Alert>
      ) : (
        <FormControlLabel
          control={<Switch checked={consent.granted} disabled={consent.salvando} onChange={(_, v) => void alternar(v)} />}
          label="Mostrar meu trajeto nos cards de compartilhamento"
          sx={{ minHeight: 44, mr: 0 }}
        />
      )}
      <Typography variant="body2" sx={{ color: surface[400] }}>
        Com isso desligado, você continua compartilhando cards sem mapa.
      </Typography>
      {consent.actionError && !avisoAberto && <Alert severity="error">Não deu para atualizar agora. Tente de novo.</Alert>}
      <TrajectoryShareConsentDialog
        open={avisoAberto}
        salvando={consent.salvando}
        desatualizado={consent.desatualizado}
        erro={consent.actionError}
        onConfirmar={() => void confirmar()}
        onRecusar={() => setAvisoAberto(false)}
        rotuloRecusar="Agora não"
        rotuloConfirmar="Entendi, mostrar trajeto"
      />
    </Box>
  );
}
