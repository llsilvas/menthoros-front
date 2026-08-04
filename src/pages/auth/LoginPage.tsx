import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/auth/useAuth';
import { AuthService } from '../../services/auth/AuthService';
import { getRoles } from '../../context/auth/session';
import { gradients, glassAzulSx, glassAzulSxHover, transitions, primary, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';
import logoMenthoros from '../../assets/icons/menthoros_mark.png';

/** Destino pós-login por role. */
function destinoPorRoles(roles: string[]): string {
  if (roles.includes('ATLETA'))  return ROUTES.ATHLETE_HOME;
  if (roles.includes('TECNICO')) return ROUTES.COACH_INBOX;
  return ROUTES.INICIO;
}

/**
 * Lê as roles da sessão a cada chamada (sem memo) — necessário porque, no fluxo de login, este
 * componente já está montado com `isAuthenticated=false` quando o token é gravado; um hook
 * memoizado (ex. `useUserInfo`) manteria `roles` congelado em vazio no re-render que segue o login,
 * mandando o atleta para `/inicio` em vez do shell dele.
 *
 * `getRoles` é síncrono por isso: é chamado no corpo do render (ver `context/auth/session`).
 */
const rolesDoTokenAtual = getRoles;

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={destinoPorRoles(rolesDoTokenAtual())} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await AuthService.login({ username, password });
      login(result.accessToken);
      navigate(destinoPorRoles(rolesDoTokenAtual()), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
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
          '&:hover': glassAzulSxHover,
        }}
      >
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img
              src={logoMenthoros}
              alt="Menthoros"
              style={{
                height: 44,
                opacity: 0.95,
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: surface[0],
                mb: 0.5,
              }}
            >
              Bem-vindo de volta
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: overlayWhite[70],
              }}
            >
              Acesse sua assessoria
            </Typography>
          </Box>

          <TextField
            label="Email ou usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={submitting}
            fullWidth
            InputLabelProps={{
              style: { color: overlayWhite[70] },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: surface[0],
                '& fieldset': {
                  borderColor: `4D`,
                },
                '&:hover fieldset': {
                  borderColor: `4D`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: primary[500],
                },
              },
              '& .MuiOutlinedInput-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            }}
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            fullWidth
            InputLabelProps={{
              style: { color: overlayWhite[70] },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: surface[0],
                '& fieldset': {
                  borderColor: `4D`,
                },
                '&:hover fieldset': {
                  borderColor: `4D`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: primary[500],
                },
              },
              '& .MuiOutlinedInput-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            }}
          />

          {error ? (
            <Alert severity="error" sx={{ bgcolor: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' }}>
              {error}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !username || !password}
            fullWidth
            sx={{
              bgcolor: primary[500],
              color: '#0e3147',
              fontWeight: 700,
              fontSize: '1rem',
              py: 1.5,
              mt: 1,
              '&:hover': {
                bgcolor: '#c5f05a',
              },
              '&:disabled': {
                bgcolor: `33`,
                color: 'rgba(14, 49, 71, 0.5)',
              },
            }}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
