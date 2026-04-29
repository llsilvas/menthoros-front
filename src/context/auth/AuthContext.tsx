import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { OpenAPI } from '../../api/core/OpenAPI';

interface AuthContextData {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);
const TOKEN_STORAGE_KEY = '@Menthoros:token';

const readToken = (): string => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(readToken()));
    useEffect(() => {
        OpenAPI.TOKEN = async () => readToken();
    }, []);

    const login = (token: string) => {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setIsAuthenticated(false);
        window.location.hash = '#/auth/login';
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
