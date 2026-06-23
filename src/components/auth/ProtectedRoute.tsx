import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/auth/useAuth';
import { ROUTES } from '../../constants/routes';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
