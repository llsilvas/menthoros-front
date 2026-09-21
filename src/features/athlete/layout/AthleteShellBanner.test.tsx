import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AthleteShellBanner } from './AthleteShellBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useIosInstallHint } from '../hooks/useIosInstallHint';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: vi.fn() }));
vi.mock('../hooks/useIosInstallHint', () => ({ useIosInstallHint: vi.fn() }));
vi.mock('../hooks/useInstallPrompt', () => ({ useInstallPrompt: vi.fn() }));

const TEXTO_OFFLINE = /Você está offline/;
const TEXTO_HINT_IOS = /No iPhone: toque em Compartilhar/;
const TEXTO_INSTALAR = 'Instalar o Menthoros na tela inicial';

interface Cenario {
  online?: boolean;
  hintIos?: boolean;
  instalacao?: boolean;
}

/**
 * Único slot acima da `AthleteBottomNav` (add-athlete-pwa-ux-hints, task 1.4): uma mensagem por
 * vez, com precedência offline > hint iOS > instalação (R2 — dois banners empilhados empurrariam
 * a barra). Os hooks são mockados: aqui só interessa a decisão do slot, não a de cada hook.
 */
function montar({ online = true, hintIos = false, instalacao = false }: Cenario = {}) {
  vi.mocked(useOnlineStatus).mockReturnValue(online);
  vi.mocked(useIosInstallHint).mockReturnValue({ canShow: hintIos, dismiss: vi.fn() });
  vi.mocked(useInstallPrompt).mockReturnValue({
    canInstall: instalacao,
    promptInstall: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn(),
  });
  return render(<AthleteShellBanner />);
}

describe('AthleteShellBanner — uma mensagem por vez', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offline com instalação disponível: só o offline', () => {
    montar({ online: false, instalacao: true });

    expect(screen.getByRole('status')).toHaveTextContent(TEXTO_OFFLINE);
    expect(screen.queryByText(TEXTO_INSTALAR)).not.toBeInTheDocument();
  });

  it('offline com hint iOS elegível: só o offline', () => {
    montar({ online: false, hintIos: true });

    expect(screen.getByRole('status')).toHaveTextContent(TEXTO_OFFLINE);
    expect(screen.queryByText(TEXTO_HINT_IOS)).not.toBeInTheDocument();
  });

  it('hint iOS sozinho: só o hint', () => {
    montar({ hintIos: true });

    expect(screen.getByText(TEXTO_HINT_IOS)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(TEXTO_INSTALAR)).not.toBeInTheDocument();
  });

  it('instalação sozinha: só a instalação', () => {
    montar({ instalacao: true });

    expect(screen.getByText(TEXTO_INSTALAR)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(TEXTO_HINT_IOS)).not.toBeInTheDocument();
  });

  it('hint iOS e instalação ao mesmo tempo (por plataforma não acontece; o slot garante): só o hint', () => {
    montar({ hintIos: true, instalacao: true });

    expect(screen.getByText(TEXTO_HINT_IOS)).toBeInTheDocument();
    expect(screen.queryByText(TEXTO_INSTALAR)).not.toBeInTheDocument();
  });

  it('nada elegível: não renderiza nada', () => {
    const { container } = montar();

    expect(container).toBeEmptyDOMElement();
  });
});
