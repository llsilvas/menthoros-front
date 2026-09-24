import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { AuthProvider } from './AuthProvider';
import { AuthContext } from './authContext';
import { userManager } from './userManager';

/**
 * Restauração de sessão **sem rede** (add-athlete-pwa-installable, item 6 / task 1.4b).
 *
 * O token vive em memória: um reload deixa o app sem usuário e a restauração pergunta ao Keycloak
 * se ainda há sessão — por `signinRedirect({ prompt: 'none' })`, que é **navegação de página
 * inteira**. Offline, essa navegação termina na página de erro do navegador, não em nenhuma tela
 * do app. Num PWA instalado é o caso mais comum: fechar e reabrir o app zera o `sessionStorage`,
 * então a guarda contra laço (`menthoros:restauracao-tentada`) nunca está lá para segurar.
 *
 * A guarda de rede resolve isso no único ponto que importa: sem rede, o app conclui anônimo e
 * renderiza (a casca precacheada aparece, o guard de rota leva ao login). Com rede, nada muda.
 */

const CHAVE_TENTATIVA = 'menthoros:restauracao-tentada';

/** Torna observável o fim de `inicializar()`: `carregando` só vira false no `finally`. */
function EstadoDeAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('EstadoDeAuth montado fora do AuthProvider');
  const { carregando, isAuthenticated } = auth;
  return <span>{carregando ? 'carregando' : isAuthenticated ? 'autenticado' : 'anonimo'}</span>;
}

async function montarEAguardarInicializacao() {
  render(
    <AuthProvider>
      <EstadoDeAuth />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText(/anonimo|autenticado/)).toBeInTheDocument());
}

describe('restauração de sessão sem rede', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Sem usuário em memória — o cenário de reload.
    vi.spyOn(userManager, 'getUser').mockResolvedValue(null);
    vi.spyOn(userManager, 'signinRedirect').mockResolvedValue(undefined);
    for (const m of ['addUserLoaded', 'addUserUnloaded', 'addAccessTokenExpiring', 'addSilentRenewError'] as const) {
      vi.spyOn(userManager.events, m).mockImplementation(() => () => {});
    }
    for (const m of ['removeUserLoaded', 'removeUserUnloaded', 'removeAccessTokenExpiring', 'removeSilentRenewError'] as const) {
      vi.spyOn(userManager.events, m).mockImplementation(() => {});
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('sem rede, não tenta restaurar: conclui anônimo sem navegar pro IdP nem gravar a marca', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await montarEAguardarInicializacao();

    expect(screen.getByText('anonimo')).toBeInTheDocument();
    expect(userManager.signinRedirect).not.toHaveBeenCalled();
    // A marca só é gravada quando a restauração é de fato tentada — sem rede, a primeira
    // tentativa continua disponível para quando a rede voltar.
    expect(sessionStorage.getItem(CHAVE_TENTATIVA)).toBeNull();
  });

  /** Controle: a guarda não pode ter quebrado o fluxo que existe hoje. */
  it('com rede, tenta restaurar com prompt=none e grava a marca contra laço', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    await montarEAguardarInicializacao();

    expect(userManager.signinRedirect).toHaveBeenCalledTimes(1);
    expect(userManager.signinRedirect).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'none' }));
    expect(sessionStorage.getItem(CHAVE_TENTATIVA)).toBe('1');
  });
});
