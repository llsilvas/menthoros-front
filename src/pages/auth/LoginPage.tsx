import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import {
    Box,
    Card,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/auth/AuthContext';
import { login as keycloakLogin, InvalidCredentialsError } from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import { gradients, glass, colors } from '../../theme/tokens';

export function LoginPage() {
    const { isAuthenticated, login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (isAuthenticated) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { accessToken } = await keycloakLogin({ username, password });
            login(accessToken);
        } catch (err) {
            if (err instanceof InvalidCredentialsError) {
                setError('Credenciais inválidas. Verifique seu usuário e senha.');
            } else {
                setError('Erro ao autenticar. Tente novamente.');
            }
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
                background: gradients.background,
                px: 2,
            }}
        >
            <Card
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: { xs: 3, sm: 4 },
                    backgroundColor: glass.background,
                    backdropFilter: glass.backdropFilter,
                    WebkitBackdropFilter: glass.backdropFilter,
                    border: `1px solid ${glass.border}`,
                    boxShadow: glass.boxShadow,
                    borderRadius: 3,
                }}
            >
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        color={colors.primary.main}
                        sx={{ fontFamily: '"Syne", "Inter", sans-serif', letterSpacing: '-0.5px' }}
                    >
                        Menthoros
                    </Typography>
                    <Typography variant="h6" color={colors.primary.main} sx={{ mt: 1 }}>
                        Entrar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Acesse sua área de treinamento
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        label="Email ou usuário"
                        fullWidth
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={submitting}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Senha"
                        type="password"
                        fullWidth
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        sx={{ mb: 3 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={submitting || !username || !password}
                        sx={{
                            backgroundColor: colors.secondary.main,
                            color: colors.secondary.contrastText,
                            fontWeight: 700,
                            py: 1.5,
                            '&:hover': { backgroundColor: colors.secondary.dark },
                        }}
                    >
                        {submitting ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
