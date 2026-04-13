import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/auth/AuthContext';
import { ROUTES } from '../../constants/routes';

export function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}
