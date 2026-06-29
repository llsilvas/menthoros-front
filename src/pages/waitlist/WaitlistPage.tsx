import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useWaitlist } from '../../hooks/useWaitlist';
import type { FaixaAtletas, PerfilWaitlist } from '../../types/Waitlist';
import { gradients, glassAzulSx, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

const FAIXAS: { value: FaixaAtletas; label: string }[] = [
  { value: 'ATE_10', label: 'Até 10 atletas' },
  { value: 'DE_11_A_30', label: 'De 11 a 30 atletas' },
  { value: 'DE_31_A_100', label: 'De 31 a 100 atletas' },
  { value: 'MAIS_DE_100', label: 'Mais de 100 atletas' },
];

export default function WaitlistPage() {
  const { status, error, inscrever } = useWaitlist();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState<PerfilWaitlist | ''>('');
  const [qtdAtletas, setQtdAtletas] = useState<FaixaAtletas | ''>('');
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot

  const submitting = status === 'submitting';
  const sucessoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === 'success') {
      sucessoRef.current?.focus();
    }
  }, [status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!perfil) {
      return;
    }
    inscrever({
      nome,
      email,
      telefone: telefone || undefined,
      perfil,
      qtdAtletas: perfil === 'TREINADOR' && qtdAtletas ? qtdAtletas : undefined,
      aceiteLgpd,
      website: website || undefined,
    });
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
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 2, ...glassAzulSx }}>
        {status === 'success' ? (
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography
              ref={sucessoRef}
              tabIndex={-1}
              variant="h5"
              sx={{ fontWeight: 700, color: surface[0], outline: 'none' }}
            >
              Você está na lista! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
              Recebemos seu cadastro. Em breve entraremos em contato sobre o acesso ao beta do Menthoros.
            </Typography>
            <Button component={RouterLink} to="/" variant="text" sx={{ mt: 1 }}>
              Voltar ao início
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0], mb: 0.5 }}>
                Entre para a lista de espera
              </Typography>
              <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
                Seja um dos primeiros a testar o Menthoros. Conte um pouco sobre você.
              </Typography>
            </Box>

            {status === 'error' && error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}

            <TextField
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={submitting}
              fullWidth
              inputProps={{ maxLength: 120 }}
            />

            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              fullWidth
              inputProps={{ maxLength: 180 }}
            />

            <TextField
              label="Telefone / WhatsApp (opcional)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={submitting}
              fullWidth
              inputProps={{ maxLength: 20 }}
            />

            <TextField
              select
              label="Você é"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as PerfilWaitlist)}
              required
              disabled={submitting}
              fullWidth
            >
              <MenuItem value="TREINADOR">Treinador(a)</MenuItem>
              <MenuItem value="ATLETA">Atleta</MenuItem>
            </TextField>

            {perfil === 'TREINADOR' && (
              <TextField
                select
                label="Quantos atletas você atende?"
                value={qtdAtletas}
                onChange={(e) => setQtdAtletas(e.target.value as FaixaAtletas)}
                disabled={submitting}
                fullWidth
              >
                {FAIXAS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Honeypot anti-spam: oculto e fora da ordem de tabulação. */}
            <Box
              component="input"
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite((e.target as HTMLInputElement).value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              sx={{
                position: 'absolute',
                width: 1,
                height: 1,
                p: 0,
                m: '-1px',
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={aceiteLgpd}
                  onChange={(e) => setAceiteLgpd(e.target.checked)}
                  disabled={submitting}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
                  Concordo em receber comunicações do Menthoros sobre o acesso ao beta e com o uso dos meus
                  dados conforme a{' '}
                  <Link component={RouterLink} to="/privacidade" underline="always">
                    Política de Privacidade
                  </Link>
                  .
                </Typography>
              }
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting || !aceiteLgpd}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? 'Enviando…' : 'Entrar na lista'}
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
