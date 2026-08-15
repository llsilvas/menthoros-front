import { Link as RouterLink, useOutletContext } from 'react-router';
import { Alert, Avatar, Box, Divider, Link, Stack, Typography } from '@mui/material';
import { ROUTES } from '../../../constants/routes';
import { text } from '../../../theme/tokens';
import { SectionCard } from '../components/SectionCard';
import { AVATAR_IMG_SLOT_PROPS, safeAvatarSrc } from '../../../shared/components/avatarSrc';
import type { CoachLayoutOutletContext } from '../layout/CoachLayout';

/** Canal oficial do encarregado de dados (LGPD). Mesmo endereço publicado na Política. */
const DPO_EMAIL = 'contato@menthoros.com';
const ASSUNTO_EXCLUSAO = encodeURIComponent('Solicitação de exclusão de conta');

const formatarData = (iso?: string): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
};

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
  // Baseado na data PARSEADA, não na string: um `consentedAt` inválido renderizaria "Aceito em "
  // vazio, dando ao coach a impressão de que existe registro quando não há nada legível.
  const temAceite = dataAceite !== null;

  // Quais documentos divergem do que está em vigor. Não afirmamos que foram "atualizados": a
  // divergência é de igualdade, não de ordem — um rollback de configuração deixa o texto vigente
  // MAIS ANTIGO que o aceito, e dizer "atualizados" seria factualmente errado.
  const divergentes = temAceite
    ? [
        consent.acceptedPolicyVersion !== consent.policyVersion ? 'Política de Privacidade' : null,
        consent.acceptedTermsVersion !== consent.termsVersion ? 'Termos de Uso' : null,
      ].filter((d): d is string => d !== null)
    : [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Configurações</Typography>

      <Stack spacing={3}>
        <SectionCard title="Assessoria">
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: text.secondary }}>
              Nome e logo da assessoria, além do plano contratado e do uso atual.
            </Typography>
            <Link component={RouterLink} to={ROUTES.COACH_SETTINGS_ASSESSORIA}>
              Configurar assessoria
            </Link>
          </Stack>
        </SectionCard>

        <SectionCard title="Dados pessoais">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
            <Avatar
              src={safeAvatarSrc(coach.avatarUrl)}
              alt={coach.name}
              slotProps={AVATAR_IMG_SLOT_PROPS}
              sx={{ width: 72, height: 72 }}
            />
            <Stack spacing={1.5}>
              <Campo rotulo="Nome" valor={coach.name} />
              <Campo rotulo="E-mail" valor={coach.email} />
            </Stack>
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: text.secondary }}>
            Estes dados vêm da sua conta de acesso e não são editáveis por aqui.
          </Typography>
        </SectionCard>

        <SectionCard title="Privacidade">
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

            {divergentes.length > 0 ? (
              <Alert severity="info">
                A versão em vigor de {divergentes.join(' e ')} é diferente da que você aceitou. Você
                será solicitado a aceitar a versão vigente no próximo acesso.
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
        </SectionCard>
      </Stack>
    </Box>
  );
}
