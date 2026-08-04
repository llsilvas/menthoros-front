import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Navigate, useLocation } from 'react-router';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/auth/useAuth';
import { getRoles } from '../../context/auth/session';
import { gradients, glassAzulSx, transitions, primary, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';
import logoMenthoros from '../../assets/icons/menthoros_mark.png';

/** Destino pós-login por role. */
function destinoPorRoles(roles: string[]): string {
  if (roles.includes('ATLETA')) return ROUTES.ATHLETE_HOME;
  if (roles.includes('TECNICO')) return ROUTES.COACH_INBOX;
  return ROUTES.INICIO;
}

/**
 * Tela de entrada.
 *
 * **Não coleta credenciais.** Desde a migração para Authorization Code + PKCE, a senha é digitada na
 * tela do Keycloak e nunca passa pela aplicação — era o que o grant anterior (ROPC, removido do
 * OAuth 2.1) exigia, e o que impedia oferecer MFA.
 *
 * As roles são lidas de forma síncrona (`getRoles`) porque a decisão de destino acontece no corpo do
 * render, logo depois de a sessão ser estabelecida.
 */
export default function LoginPage() {
  const { isAuthenticated, carregando, login } = useAuth();
  const location = useLocation();
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');

  // Enquanto o bootstrap ou o callback estão em curso, mostrar o botão faria a tela piscar
  // login → dashboard para quem já tem sessão.
  if (carregando) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: gradients.background,
        }}
      >
        <CircularProgress aria-label="Verificando sessão" />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={destinoPorRoles(getRoles())} replace />;
  }

  const handleEntrar = async () => {
    setEntrando(true);
    setErro('');
    try {
      // A rota que o guard tentou proteger volta como destino; sem isso, quem foi interrompido em
      // `#/coach/inbox` reapareceria na raiz.
      const de = (location.state as { de?: string } | null)?.de;
      await login(de ? `#${de}` : undefined);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível iniciar o login.');
      setEntrando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: gradients.background,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: 2,
          transition: transitions.default,
          ...glassAzulSx,
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src={logoMenthoros} alt="Menthoros" style={{ height: 44, opacity: 0.95 }} />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0], mb: 0.5 }}>
              Bem-vindo de volta
            </Typography>
            <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
              Acesse sua assessoria
            </Typography>
          </Box>

          {erro ? <Alert severity="error">{erro}</Alert> : null}

          <Button
            onClick={handleEntrar}
            variant="contained"
            disabled={entrando}
            fullWidth
            sx={{
              bgcolor: primary[500],
              color: '#0e3147',
              fontWeight: 700,
              fontSize: '1rem',
              py: 1.5,
              '&:hover': { bgcolor: '#c5f05a' },
            }}
          >
            {entrando ? 'Redirecionando...' : 'Entrar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
