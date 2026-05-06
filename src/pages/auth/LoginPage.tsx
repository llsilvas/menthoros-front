import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Navigate, useNavigate } from 'react-router';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/auth/AuthContext';
import { AuthService } from '../../services/auth/AuthService';
import { gradients } from '../../theme/tokens';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await AuthService.login({ username, password });
      login(result.accessToken);
      navigate(ROUTES.HOME, { replace: true });
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
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(255,255,255,0.7)',
        }}
      >
        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Entrar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acesse o dashboard Menthoros.
            </Typography>
          </Box>

          <TextField
            label="Email ou usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={submitting}
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            fullWidth
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Button type="submit" variant="contained" disabled={submitting || !username || !password} fullWidth>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
