import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { OpenAPI } from '../../api/core/OpenAPI';
import { ROUTES } from '../../constants/routes';

const TOKEN_KEY = '@Menthoros:token';

export type AuthUser = {
    name: string;
    username: string;
    role: string;
    initials: string;
};

interface AuthContextData {
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (token: string) => void;
    logout: () => void;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return {};
    }
}

function extractUser(token: string | null): AuthUser | null {
    if (!token) return null;
    const payload = decodeJwtPayload(token);

    const name = (payload['name'] as string) || (payload['preferred_username'] as string) || 'Usuário';
    const username = (payload['preferred_username'] as string) || '';

    const realmRoles = (payload['realm_access'] as { roles?: string[] } | undefined)?.roles ?? [];
    const clientRoles =
        (payload['resource_access'] as Record<string, { roles?: string[] }> | undefined)?.[
            'menthoros-api'
        ]?.roles ?? [];
    const roles = [...clientRoles, ...realmRoles].filter(
        (r) => !['default-roles-menthoros', 'offline_access', 'uma_authorization'].includes(r),
    );
    const role = roles[0] ?? '';

    const parts = name.trim().split(' ');
    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.slice(0, 2).toUpperCase();

    return { name, username, role, initials };
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!storedToken);
    const [user, setUser] = useState<AuthUser | null>(() => extractUser(storedToken));

    const login = (token: string) => {
        localStorage.setItem(TOKEN_KEY, token);
        OpenAPI.TOKEN = () => Promise.resolve(localStorage.getItem(TOKEN_KEY) ?? '');
        setIsAuthenticated(true);
        setUser(extractUser(token));
        navigate(ROUTES.HOME);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        navigate(ROUTES.LOGIN);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
