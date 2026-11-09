import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { ROUTES } from '../../../../constants/routes';
import { surface } from '../../../../theme/tokens';

export interface TrajectoryShareConsentDialogProps {
  open: boolean;
  salvando: boolean;
  desatualizado: boolean;
  erro: Error | null;
  onConfirmar: () => void;
  /** Sair sem mapa: no compartilhamento troca o modelo; no perfil só fecha. */
  onRecusar: () => void;
  rotuloRecusar: string;
  rotuloConfirmar?: string;
}

/**
 * Aviso de consentimento específico (LGPD Art. 11, I) antes da primeira imagem com trajeto GPS.
 * Texto curto e literal sobre início e fim — é o que o atleta precisa entender para decidir.
 */
export function TrajectoryShareConsentDialog({
  open, salvando, desatualizado, erro, onConfirmar, onRecusar, rotuloRecusar, rotuloConfirmar = 'Entendi, compartilhar',
}: TrajectoryShareConsentDialogProps) {
  return (
    <Dialog open={open} onClose={onRecusar} aria-labelledby="trajeto-consent-titulo" maxWidth="xs" fullWidth>
      <DialogTitle id="trajeto-consent-titulo">Seu trajeto vai aparecer na imagem</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="body1">
          Esta imagem mostra seu trajeto completo, incluindo onde você começou e terminou. Esses
          pontos podem revelar lugares que você frequenta, como sua casa ou trabalho.
        </Typography>
        <Typography variant="body2" sx={{ color: surface[400] }}>
          Depois de publicada, a imagem fica fora do controle da Menthoros. Você pode revogar esta
          confirmação a qualquer momento no Perfil, em Privacidade.{' '}
          <Link component={RouterLink} to={ROUTES.PRIVACIDADE} target="_blank" rel="noopener noreferrer">
            Ver a Política de Privacidade (item 6.4)
          </Link>
        </Typography>
        {desatualizado && (
          <Alert severity="warning">
            A Política de Privacidade foi atualizada. Recarregue a página para ler a versão nova antes de confirmar.
          </Alert>
        )}
        {erro && <Alert severity="error">Não deu para registrar agora. Tente de novo.</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onRecusar} sx={{ minHeight: 44 }}>{rotuloRecusar}</Button>
        <Button variant="contained" onClick={onConfirmar} disabled={salvando || desatualizado} sx={{ minHeight: 44 }}>
          {salvando ? 'Registrando…' : rotuloConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
