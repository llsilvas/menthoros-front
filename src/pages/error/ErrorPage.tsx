import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink, isRouteErrorResponse, useRouteError } from 'react-router';
import { elevation, surface } from '../../shared/design-tokens';
import { PRIMARY_BTN_SX } from '../../shared/components/actionButtonSx';
import { ROUTES } from '../../constants/routes';

export interface ErrorPageProps {
  /**
   * Explícito porque o catch-all (`path: '*'`) usa `element`, não `errorElement` — a rota
   * combina normalmente, então `useRouteError()` não carrega um erro 404 pra inferir sozinho.
   * Omitido (uso como `errorElement` de um erro de render de verdade), assume `'crash'`.
   */
  kind?: 'not-found' | 'crash';
}

/**
 * Página de erro no tema (polish-inbox-visual-semantics) — cobre rota inexistente (404, via
 * catch-all) e erro de render (via `errorElement`), em vez do fallback default do React Router
 * ("Unexpected Application Error!"), que expõe stack trace/jargão de desenvolvedor a quem só
 * clicou num link quebrado.
 */
export function ErrorPage({ kind }: ErrorPageProps) {
  const error = useRouteError();
  const rotaInexistente = kind === 'not-found' || (isRouteErrorResponse(error) && error.status === 404);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: elevation.base,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4">
        {rotaInexistente ? 'Página não encontrada' : 'Algo deu errado'}
      </Typography>
      <Typography variant="body1" sx={{ color: surface[400], maxWidth: 420 }}>
        {rotaInexistente
          ? 'O endereço que você tentou abrir não existe ou foi movido.'
          : 'Encontramos um problema ao carregar esta página. Tente voltar e navegar de novo.'}
      </Typography>
      <Button component={RouterLink} to={ROUTES.COACH_INBOX} variant="contained" sx={PRIMARY_BTN_SX}>
        Voltar ao inbox
      </Button>
    </Box>
  );
}

export default ErrorPage;
