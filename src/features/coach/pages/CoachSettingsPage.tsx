import { Link as RouterLink, useOutletContext } from 'react-router';
import { Alert, Avatar, Box, Divider, Link, Paper, Stack, Typography } from '@mui/material';
import { ROUTES } from '../../../constants/routes';
import { elevation } from '../../../shared/design-tokens';
import { text } from '../../../theme/tokens';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

/** Canal oficial do encarregado de dados (LGPD). Mesmo endereço publicado na Política. */
const DPO_EMAIL = 'contato@menthoros.com';
const ASSUNTO_EXCLUSAO = encodeURIComponent('Solicitação de exclusão de conta');

const formatarData = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: elevation.card, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{titulo}</Typography>
      {children}
    </Paper>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: text.secondary }}>{rotulo}</Typography>
      <Typography variant="body1">{valor}</Typography>
    </Box>
  );
}

/**
 * Perfil e privacidade do coach.
 *
 * <p>Somente leitura por decisão de escopo: a fonte da verdade de nome, e-mail e avatar é o
 * Keycloak, e escrever lá exige o Admin API.
 *
 * <p>Consome `coach`/`consent` do outlet context, **não** chamando `useCurrentUser` de novo: o hook
 * não busca sozinho, então uma segunda instância ficaria em fallback vazio para sempre, e disparar
 * o fetch nela duplicaria o `GET /users/me` que o layout já fez.
 */
export default function CoachSettingsPage() {
  const { coach, consent } = useOutletContext<CoachLayoutOutletContext>();

  const dataAceite = formatarData(consent.consentedAt);
  const temAceite = Boolean(consent.consentedAt);
  // Aceitou, mas de um texto que já não é o vigente — houve bump de versão desde então.
  const aceiteDesatualizado = temAceite && !consent.granted;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Configurações</Typography>

      <Stack spacing={3}>
        <Secao titulo="Dados pessoais">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
            <Avatar
              src={coach.avatarUrl}
              alt={coach.name}
              // URL externa vinda do Keycloak: sem isto o navegador manda a rota interna do coach
              // no header de referrer para um terceiro.
              slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
              sx={{ width: 72, height: 72 }}
            />
            <Stack spacing={1.5}>
              <Campo rotulo="Nome" valor={coach.name} />
              <Campo rotulo="E-mail" valor={coach.email ?? '—'} />
            </Stack>
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: text.secondary }}>
            Estes dados vêm da sua conta de acesso e não são editáveis por aqui.
          </Typography>
        </Secao>

        <Secao titulo="Privacidade">
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: text.secondary }}>
                Consentimento registrado
              </Typography>
              {temAceite ? (
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">Aceito em {dataAceite}</Typography>
                  <Typography variant="body2">
                    Política de Privacidade — versão {consent.acceptedPolicyVersion}
                  </Typography>
                  <Typography variant="body2">
                    Termos de Uso — versão {consent.acceptedTermsVersion}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Nenhum aceite registrado.
                </Typography>
              )}
            </Box>

            {aceiteDesatualizado ? (
              <Alert severity="info">
                Os documentos foram atualizados desde o seu aceite. A versão em vigor é{' '}
                {consent.policyVersion}; você será solicitado a aceitá-la no próximo acesso.
              </Alert>
            ) : null}

            <Divider />

            <Link component={RouterLink} to={ROUTES.PRIVACIDADE} target="_blank" rel="noopener noreferrer">
              Ler a Política de Privacidade
            </Link>

            <Link href={`mailto:${DPO_EMAIL}`}>Falar com o encarregado de dados (DPO)</Link>

            <Box>
              <Link href={`mailto:${DPO_EMAIL}?subject=${ASSUNTO_EXCLUSAO}`}>
                Solicitar exclusão de conta
              </Link>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: text.secondary }}>
                A solicitação será confirmada por e-mail antes de qualquer exclusão.
              </Typography>
            </Box>
          </Stack>
        </Secao>
      </Stack>
    </Box>
  );
}
