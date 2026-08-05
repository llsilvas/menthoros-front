import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export default function ProtectedRoute() {
  const { isAuthenticated, carregando } = useAuth();
  const location = useLocation();

  /**
   * "Ainda não sei" não é "não autenticado".
   *
   * Enquanto o retorno do fluxo de autorização ou uma renovação estão em curso, redirecionar ao
   * login interromperia o próprio login — e, como a tela de login dispara um novo fluxo, o par
   * entraria em laço. Mesma classe do spinner infinito de `add-coach-settings-page`: tratar
   * ausência de resposta como resposta negativa.
   */
  if (carregando) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Verificando sessão" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Guarda a rota tentada, para o login devolver o usuário a ela depois de autenticar.
    return <Navigate to={ROUTES.LOGIN} replace state={{ de: location.pathname }} />;
  }

  return <Outlet />;
}
