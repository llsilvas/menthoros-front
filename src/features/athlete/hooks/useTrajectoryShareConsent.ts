import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { TrajetoShareConsentService } from '../../../api/services/TrajetoShareConsentService';
import { POLITICA_VERSAO } from '../../../pages/waitlist/politicaPrivacidadeConteudo';

/**
 * Consentimento do atleta para o trajeto GPS aparecer nos cards (lgpd-trajeto-cards-compartilhamento, D3).
 * Lido do servidor a cada montagem, sem cache local: revogar em um aparelho vale no outro.
 */
/** `enabled` falso não consulta o servidor (tela sem modelo com mapa). */
export function useTrajectoryShareConsent(enabled = true) {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [salvando, setSalvando] = useState(false);
  /** Falha ao ler o estado: a chave não pode ser mostrada, porque "desligado" seria um palpite. */
  const [loadError, setLoadError] = useState<Error | null>(null);
  /** Falha ao conceder ou revogar; separada para não reaparecer no aviso aberto depois. */
  const [actionError, setActionError] = useState<Error | null>(null);
  /** A Política mudou depois que a página carregou: o atleta precisa recarregar antes de aceitar. */
  const [desatualizado, setDesatualizado] = useState(false);

  const fetchConsent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setGranted((await TrajetoShareConsentService.obter()).granted);
    } catch (e) {
      setLoadError(e instanceof Error ? e : new Error('Erro ao carregar o consentimento'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void fetchConsent();
  }, [enabled, fetchConsent]);

  /** Envia a versão que o aviso apresentou — o servidor recusa se não for a vigente. */
  const confirmar = useCallback(async (): Promise<boolean> => {
    setSalvando(true);
    setActionError(null);
    try {
      setGranted((await TrajetoShareConsentService.conceder(POLITICA_VERSAO)).granted);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setDesatualizado(true);
      else setActionError(e instanceof Error ? e : new Error('Erro ao registrar o consentimento'));
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  const revogar = useCallback(async (): Promise<boolean> => {
    setSalvando(true);
    setActionError(null);
    try {
      setGranted((await TrajetoShareConsentService.revogar()).granted);
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e : new Error('Erro ao revogar o consentimento'));
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  const limparErro = useCallback(() => setActionError(null), []);

  return { granted, loading, salvando, loadError, actionError, desatualizado, fetchConsent, confirmar, revogar, limparErro };
}
