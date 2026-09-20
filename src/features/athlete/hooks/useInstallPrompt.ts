import { useCallback, useEffect, useState } from 'react';

/** Dispensa lembrada por dispositivo — conveniência de UI, não estado de domínio. */
export const DISMISS_STORAGE_KEY = 'menthoros:pwa-install-dismissed';

/**
 * `beforeinstallprompt` é só Chromium e a spec ainda é rascunho — `lib.dom` não o tipa. Declarado
 * aqui, estreito, em vez de `any`.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// `localStorage` pode lançar (modo privado, storage bloqueado): sem ele o CTA funciona, só não
// lembra a dispensa — degradar é melhor do que quebrar o shell inteiro por uma conveniência.
function lerDispensa(): boolean {
  try {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function gravarDispensa(): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, '1');
  } catch {
    // sem storage: a dispensa vale só nesta sessão
  }
}

// jsdom e navegadores antigos não têm `matchMedia`; sem ele, assume "não instalado".
function rodandoInstalado(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Prompt de instalação do PWA (Android/Chromium).
 *
 * O navegador entrega o prompt uma única vez por visita elegível, via `beforeinstallprompt`. O hook
 * cancela o default (a mini-infobar do Chrome), guarda o evento e expõe `canInstall`; `promptInstall`
 * consome o evento — depois dele, aceito ou não, não há mais o que oferecer até a próxima visita.
 * iOS nunca dispara o evento: lá só as meta tags do `index.html` atuam (limitação de plataforma).
 */
export function useInstallPrompt() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [dispensado, setDispensado] = useState(lerDispensa);
  const [instalado, setInstalado] = useState(rodandoInstalado);

  useEffect(() => {
    const aoOferecer = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const aoInstalar = () => {
      setInstalado(true);
      setEvento(null);
    };
    window.addEventListener('beforeinstallprompt', aoOferecer);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoOferecer);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === 'accepted') setInstalado(true);
    setEvento(null);
  }, [evento]);

  const dismiss = useCallback(() => {
    gravarDispensa();
    setDispensado(true);
  }, []);

  return {
    canInstall: evento !== null && !dispensado && !instalado,
    promptInstall,
    dismiss,
  };
}
