import { Navigate, Outlet } from 'react-router';
import { useUserInfo } from '../../hooks/useUserInfo';
import { ROUTES } from '../../constants/routes';

interface RoleRouteProps {
  /** Roles que podem acessar o shell aninhado (ex.: `['ATLETA']`). */
  allow: string[];
  /** Destino quando a role não é permitida (default: início neutro). */
  redirectTo?: string;
}

/**
 * Guarda de rota por role. Deve ser aninhada dentro de `ProtectedRoute` (autenticação).
 * Evita que um usuário sem a role adequada caia num shell cujos endpoints o backend nega
 * (ex.: coach/admin abrindo `/athlete/*`, cujas rotas exigem `hasRole('ATLETA')` e devolvem 403).
 */
export default function RoleRoute({ allow, redirectTo = ROUTES.INICIO }: RoleRouteProps) {
  const { roles } = useUserInfo();
  const permitido = (roles ?? []).some((role) => allow.includes(role));

  if (!permitido) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
