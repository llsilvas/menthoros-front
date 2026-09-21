import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useIosInstallHint } from '../hooks/useIosInstallHint';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { InstallPromptBanner } from './InstallPromptBanner';
import { IosInstallHintBanner } from './IosInstallHintBanner';
import { OfflineBanner } from './OfflineBanner';

/**
 * Único slot de mensagem acima da `AthleteBottomNav`: uma por vez, com precedência
 * offline > hint iOS > instalação. Dois banners empilhados empurrariam a barra; e offline não há
 * o que instalar, então ele vence. Hint iOS e instalação já são exclusivos por plataforma — a
 * ordem aqui só fecha a porta.
 */
export function AthleteShellBanner() {
  const online = useOnlineStatus();
  const hintIos = useIosInstallHint();
  const instalacao = useInstallPrompt();

  if (!online) return <OfflineBanner />;
  if (hintIos.canShow) return <IosInstallHintBanner onDismiss={hintIos.dismiss} />;
  if (instalacao.canInstall) {
    return <InstallPromptBanner onInstall={instalacao.promptInstall} onDismiss={instalacao.dismiss} />;
  }
  return null;
}
