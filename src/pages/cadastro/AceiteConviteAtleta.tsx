import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AthleteInviteAcceptInput } from '../../types/AthleteInvite';
import type { AthleteInviteLookup } from '../../types/AthleteInvite';
import type { AthleteInviteStatus } from '../../hooks/useAthleteInvite';
import { surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

const TAMANHO_MINIMO_DA_SENHA = 12;

interface AceiteConviteAtletaProps {
  token: string;
  dados: AthleteInviteLookup;
  status: AthleteInviteStatus;
  error: string | null;
  onAceitar: (input: AthleteInviteAcceptInput) => void;
  onIrParaLogin: () => void;
}

/**
 * Formulário de aceite do convite de atleta. Diferença deliberada do fluxo de coach: o e-mail é
 * EDITÁVEL — o vínculo com o atleta é feito pelo token, não pelo e-mail (a dependência do e-mail
 * foi o que deixou um atleta órfão no incidente de 2026-09-04). E-mail trocado nasce com
 * verificação pendente.
 */
export default function AceiteConviteAtleta({
  token,
  dados,
  status,
  error,
  onAceitar,
  onIrParaLogin,
}: AceiteConviteAtletaProps) {
  const [nome, setNome] = useState(dados.nomeAtleta);
  const [email, setEmail] = useState(dados.emailSugerido);
  const [senha, setSenha] = useState('');
  const sucessoRef = useRef<HTMLElement>(null);

  const submitting = status === 'submitting';
  const senhaCurta = senha.length > 0 && senha.length < TAMANHO_MINIMO_DA_SENHA;
  const emailTrocado = email.trim().toLowerCase() !== dados.emailSugerido.trim().toLowerCase();
  const podeEnviar = !submitting && nome.trim() && email.trim() && senha && !senhaCurta;

  useEffect(() => {
    if (status === 'success') {
      sucessoRef.current?.focus();
    }
  }, [status]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) {
      return;
    }
    onAceitar({
      token,
      nome: nome.trim(),
      senha,
      email: emailTrocado ? email.trim() : undefined,
    });
  };

  if (status === 'success') {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography
          ref={sucessoRef}
          tabIndex={-1}
          variant="h5"
          sx={{ fontWeight: 700, color: surface[0], outline: 'none' }}
        >
          Conta criada!
        </Typography>
        <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
          Sua conta está vinculada à assessoria {dados.assessoria}. Entre para ver seu painel e
          completar seu perfil de treino.
        </Typography>
        {emailTrocado && (
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            Enviamos um e-mail de verificação para <strong>{email.trim()}</strong>.
          </Typography>
        )}
        <Button variant="contained" onClick={onIrParaLogin} sx={{ mt: 1 }}>
          Ir para o login
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} component="form" onSubmit={handleSubmit} noValidate>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0], mb: 0.5 }}>
          Seu treinador te convidou
        </Typography>
        <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
          A assessoria {dados.assessoria} usa o Menthoros para planejar seus treinos. Confirme seus
          dados e escolha uma senha.
        </Typography>
      </Box>

      {status === 'error' && error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}

      <TextField
        label="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        disabled={submitting}
        fullWidth
        inputProps={{ maxLength: 120 }}
      />

      <TextField
        label="Seu e-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={submitting}
        fullWidth
        inputProps={{ maxLength: 100 }}
        helperText={
          emailTrocado
            ? 'Diferente do e-mail do convite: você receberá um e-mail de verificação.'
            : 'Pode usar outro e-mail, se preferir.'
        }
      />

      <TextField
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
        disabled={submitting}
        fullWidth
        error={senhaCurta}
        helperText={
          senhaCurta
            ? `Use ao menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
            : `Ao menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`
        }
        inputProps={{ maxLength: 128, minLength: TAMANHO_MINIMO_DA_SENHA }}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!podeEnviar}
        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        {submitting ? 'Criando…' : 'Criar minha conta'}
      </Button>
    </Stack>
  );
}
