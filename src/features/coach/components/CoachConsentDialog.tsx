import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  Typography,
} from '@mui/material';
import { CoachDialog } from '../../../shared/components/CoachDialog';
import { PRIMARY_BTN_SX } from '../../../shared/components/actionButtonSx';

export interface CoachConsentDialogProps {
  open: boolean;
  /** Versão vigente da Política, vinda de `GET /users/me` — nunca constante local. */
  policyVersion: string;
  /** Versão vigente dos Termos, vinda de `GET /users/me`. */
  termsVersion: string;
  onAccept: (versoes: { policyVersion: string; termsVersion: string }) => Promise<void>;
}

const MSG_ERRO_PADRAO = 'Não foi possível registrar seu aceite. Tente novamente.';
const MSG_VERSAO_DEFASADA =
  'Os termos foram atualizados enquanto esta página estava aberta. Leia a nova versão e aceite novamente.';

/** O backend recusa aceite de versão defasada com este código (409). */
const isVersaoDefasada = (erro: unknown): boolean =>
  typeof erro === 'object' && erro !== null &&
  (erro as { body?: { code?: string } }).body?.code === 'CONSENT_VERSION_STALE';

/**
 * Aceite dos Termos de Uso e da Política de Privacidade, exigido antes de o coach operar.
 *
 * <p>Bloqueante por construção: sem botão de fechar e com `onClose` no-op, não há como dispensar —
 * nem pelo backdrop, nem pelo Esc. Isso é UX; a garantia real é o `403` do backend, porque o modal
 * sozinho seria contornável por qualquer cliente de API.
 *
 * <p>Nasce **standalone**, sem numeração de passo: `coach-first-login-wizard` exibirá outro overlay
 * logo depois e é ele quem conhece o total de passos. Fixar "Passo 1 de N" aqui codificaria uma
 * decisão que ainda não existe.
 */
export function CoachConsentDialog({
  open,
  policyVersion,
  termsVersion,
  onAccept,
}: CoachConsentDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const podeAceitar = termsAccepted && privacyAccepted && !enviando;

  const handleAccept = async () => {
    setEnviando(true);
    setErro(null);
    try {
      await onAccept({ policyVersion, termsVersion });
    } catch (e) {
      if (isVersaoDefasada(e)) {
        // Desmarca: o usuário precisa ler o texto novo antes de aceitar de novo — reaproveitar o
        // aceite anterior registraria consentimento sobre um conteúdo que ele não viu.
        setTermsAccepted(false);
        setPrivacyAccepted(false);
        setErro(MSG_VERSAO_DEFASADA);
      } else {
        setErro(MSG_ERRO_PADRAO);
      }
    } finally {
      setEnviando(false);
    }
  };

  const acoes = (
    <Button
      sx={PRIMARY_BTN_SX}
      disabled={!podeAceitar}
      onClick={handleAccept}
      startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : undefined}
    >
      Aceitar e continuar
    </Button>
  );

  return (
    <CoachDialog
      open={open}
      onClose={() => { /* bloqueante: não há como dispensar sem aceitar */ }}
      showClose={false}
      maxWidth="sm"
      title="Antes de continuar"
      subtitle="Precisamos do seu aceite para seguir com o uso da plataforma."
      actions={acoes}
    >
      <Typography variant="body2" sx={{ mb: 2 }}>
        Tratamos seus dados de treinador — nome, e-mail, avatar e registro de acesso — para operar a
        plataforma. Leia e confirme abaixo.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              inputProps={{ 'aria-label': 'Li e aceito os Termos de Uso' }}
            />
          }
          label={
            <Typography variant="body2">
              Li e aceito os <strong>Termos de Uso</strong>
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              inputProps={{
                'aria-label':
                  'Consinto com o tratamento dos meus dados pessoais conforme a Política de Privacidade',
              }}
            />
          }
          label={
            <Typography variant="body2">
              Consinto com o tratamento dos meus dados pessoais (nome, e-mail, avatar e registro de
              acesso) conforme a Política de Privacidade
            </Typography>
          }
        />
      </Box>

      {/*
        O link fica FORA do FormControlLabel de propósito. Dentro, ele vira conteúdo do <label>, que
        repassa qualquer clique ao checkbox — então clicar para LER a política acabava apenas
        marcando o aceite, sem abrir nada. Num fluxo de consentimento isso é grave: registra aceite
        de um texto que o usuário tentou ler e não conseguiu.
      */}
      <Typography variant="body2" sx={{ mt: 1.5 }}>
        <Link href="/privacidade" target="_blank" rel="noopener">
          Ler a Política de Privacidade
        </Link>
      </Typography>

      {erro ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {erro}
        </Alert>
      ) : null}
    </CoachDialog>
  );
}
