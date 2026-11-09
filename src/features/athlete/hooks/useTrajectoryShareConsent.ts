import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { TrajetoShareConsentService } from '../../../api/services/TrajetoShareConsentService';
import { POLITICA_VERSAO } from '../../../pages/waitlist/politicaPrivacidadeConteudo';

/**
 * Consentimento do atleta para o trajeto GPS aparecer nos cards (lgpd-trajeto-cards-compartilhamento, D3).
 * Lido do servidor a cada montagem, sem cache local: revogar em um aparelho vale no outro.
 */
export function useTrajectoryShareConsent() {
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  /** A Política mudou depois que a página carregou: o atleta precisa recarregar antes de aceitar. */
  const [desatualizado, setDesatualizado] = useState(false);

  const fetchConsent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGranted((await TrajetoShareConsentService.obter()).granted);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Erro ao carregar o consentimento'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConsent();
  }, [fetchConsent]);

  /** Envia a versão que o aviso apresentou — o servidor recusa se não for a vigente. */
  const confirmar = useCallback(async (): Promise<boolean> => {
    setSalvando(true);
    setError(null);
    try {
      setGranted((await TrajetoShareConsentService.conceder(POLITICA_VERSAO)).granted);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setDesatualizado(true);
      else setError(e instanceof Error ? e : new Error('Erro ao registrar o consentimento'));
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  const revogar = useCallback(async (): Promise<boolean> => {
    setSalvando(true);
    setError(null);
    try {
      setGranted((await TrajetoShareConsentService.revogar()).granted);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Erro ao revogar o consentimento'));
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  return { granted, loading, salvando, error, desatualizado, fetchConsent, confirmar, revogar };
}
