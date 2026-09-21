import { useEffect, useState } from 'react';

/**
 * Repassa o que o navegador afirma sobre a rede. `navigator.onLine === false` é confiável (só
 * acontece sem interface de rede); `true` pode mentir (portal cativo) — por isso o shell só
 * afirma "offline", nunca "online". Sem polling e sem detecção de conectividade real (non-goal).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const aoFicarOnline = () => setOnline(true);
    const aoFicarOffline = () => setOnline(false);
    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);
    return () => {
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, []);

  return online;
}
