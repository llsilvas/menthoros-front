import { Link as RouterLink } from 'react-router';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { gradients, glassAzulSx, surface } from '../../theme/tokens';
import { overlayWhite } from '../../theme/overlays';

// Placeholder: o conteúdo real da Política de Privacidade é publicado antes do go-live (tasks.md 4.3).
export default function PrivacidadePage() {
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
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 640, p: { xs: 3, sm: 4 }, borderRadius: 2, ...glassAzulSx }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: surface[0] }}>
            Política de Privacidade
          </Typography>
          <Typography variant="body2" sx={{ color: overlayWhite[70] }}>
            Tratamos os dados informados na lista de espera (nome, e-mail e, se fornecido, telefone)
            exclusivamente para contato sobre o acesso ao beta do Menthoros. Você pode solicitar a remoção
            dos seus dados a qualquer momento. O conteúdo completo desta política será publicado em breve.
          </Typography>
          <Button component={RouterLink} to="/waitlist" variant="text" sx={{ alignSelf: 'flex-start' }}>
            Voltar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
