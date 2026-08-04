import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './authContext';
import { isTokenValid } from './jwt';
import { clearToken, getAccessTokenSync, setToken } from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Leitura SÍNCRONA de propósito: o estado inicial define se o guard de rota deixa passar no
  // primeiro render. Um valor assíncrono aqui faria toda montagem começar como "não autenticado".
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid(getAccessTokenSync()));

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = getAccessTokenSync();
      if (token && !isTokenValid(token)) {
        setIsAuthenticated(false);
        clearToken();
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = (token: string) => {
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearToken();
    setIsAuthenticated(false);
    window.location.hash = '#/auth/login';
  };

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}
