import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './authContext';
import { isTokenValid } from './jwt';

const TOKEN_STORAGE_KEY = '@Menthoros:token';

const readToken = (): string => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid(readToken()));

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = readToken();
      if (token && !isTokenValid(token)) {
        setIsAuthenticated(false);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
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

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}
