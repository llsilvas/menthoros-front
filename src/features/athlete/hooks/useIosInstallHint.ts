import { useCallback, useState } from 'react';

/** Dispensa lembrada por dispositivo — conveniência de UI, não estado de domínio. */
export const IOS_HINT_DISMISS_KEY = 'menthoros:pwa-ios-hint-dismissed';

/**
 * `navigator.standalone` é só do MobileSafari e `lib.dom` não a tipa. `declare global` porque
 * este arquivo é um módulo — uma `interface Navigator` solta aqui seria local e não compilaria.
 */
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// `localStorage` pode lançar (modo privado, storage bloqueado): sem ele o hint funciona, só não
// lembra a dispensa — degradar é melhor do que quebrar o shell por uma conveniência.
function lerDispensa(): boolean {
  try {
    return localStorage.getItem(IOS_HINT_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function gravarDispensa(): void {
  try {
    localStorage.setItem(IOS_HINT_DISMISS_KEY, '1');
  } catch {
    // sem storage: a dispensa vale só nesta sessão
  }
}

// jsdom e navegadores antigos não têm `matchMedia`; sem ele, assume "não instalado".
function rodandoInstalado(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * `false` = Safari iOS aberto em aba (o único caso em que o hint ajuda); `true` = lançado da tela
 * inicial; `undefined` = qualquer outro navegador — inclusive Chrome/Firefox no iOS, que não
 * expõem a propriedade (falso negativo aceito; sem UA sniffing).
 */
function safariIosEmAba(): boolean {
  return navigator.standalone === false;
}

/**
 * Hint de instalação para iOS. A Apple não expõe `beforeinstallprompt`: o gesto "Compartilhar →
 * Adicionar à Tela de Início" é manual, e este hook só decide se vale mostrá-lo.
 */
export function useIosInstallHint() {
  const [dispensado, setDispensado] = useState(lerDispensa);

  const dismiss = useCallback(() => {
    gravarDispensa();
    setDispensado(true);
  }, []);

  return {
    canShow: safariIosEmAba() && !rodandoInstalado() && !dispensado,
    dismiss,
  };
}
