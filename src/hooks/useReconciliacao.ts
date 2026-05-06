import { useState, useCallback, useEffect, useRef } from 'react';
import { ReconciliacaoService } from '../api/services/ReconciliacaoService';
import type {
  PendingActivityReview,
  CandidateMatch,
  ReconciliationAction,
} from '../types/Reconciliacao';

interface CandidateCache {
  data: CandidateMatch[];
  loading: boolean;
  error: string | null;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const RETRY_DELAYS = [500, 1500, 4500]; // exponential backoff

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }
  throw lastError;
}

export function useReconciliacao() {
  const [atletaId, setAtletaId] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    statuses: ['AMBIGUO', 'NAO_PLANEJADO'],
    dataInicio: '',
    dataFim: '',
  });
  const [page, setPage] = useState(0);
  const [activities, setActivities] = useState<PendingActivityReview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidatosRef = useRef<Record<string, CandidateCache>>({});
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar pendentes quando atletaId ou filtros mudam
  useEffect(() => {
    if (!atletaId) {
      setActivities([]);
      setError(null);
      return;
    }

    const loadPendentes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWithRetry(() =>
          ReconciliacaoService.listarPendentes(atletaId, {
            statuses: filtros.statuses,
            dataInicio: filtros.dataInicio || undefined,
            dataFim: filtros.dataFim || undefined,
            page,
            size: 20,
          })
        );
        setActivities(data.content);
        setTotalPages(data.totalPages);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar pendentes';
        setError(message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterTimeoutRef.current = setTimeout(loadPendentes, 500);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [atletaId, filtros, page]);

  const updateFiltros = useCallback(
    (updates: Partial<typeof filtros>) => {
      setFiltros((prev) => ({ ...prev, ...updates }));
      setPage(0);
    },
    []
  );

  const toggleExpanded = useCallback(
    (activityId: string) => {
      setActivities((prev) =>
        prev.map((activity) => {
          if (activity.id === activityId) {
            const newExpanded = !activity.isExpanded;
            if (newExpanded && !candidatosRef.current[activityId]) {
              loadCandidatos(activityId);
            }
            return { ...activity, isExpanded: newExpanded };
          }
          return activity;
        })
      );
    },
    []
  );

  const loadCandidatos = async (treinoRealizadoId: string) => {
    const cache = candidatosRef.current[treinoRealizadoId];
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return;
    }

    candidatosRef.current[treinoRealizadoId] = {
      data: [],
      loading: true,
      error: null,
      timestamp: Date.now(),
    };

    try {
      const data = await fetchWithRetry(() =>
        ReconciliacaoService.listarCandidatos(treinoRealizadoId)
      );
      candidatosRef.current[treinoRealizadoId] = {
        data,
        loading: false,
        error: null,
        timestamp: Date.now(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar candidatos';
      candidatosRef.current[treinoRealizadoId] = {
        data: [],
        loading: false,
        error: message,
        timestamp: Date.now(),
      };
    }
  };

  const getCandidatos = useCallback((treinoRealizadoId: string) => {
    return candidatosRef.current[treinoRealizadoId] || {
      data: [],
      loading: false,
      error: null,
    };
  }, []);

  const executarAcao = useCallback(
    async (
      treinoRealizadoId: string,
      action: ReconciliationAction,
      treinoPlanejadoId?: string
    ) => {
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === treinoRealizadoId
            ? { ...activity, isSubmitting: true, error: null }
            : activity
        )
      );

      try {
        await fetchWithRetry(() =>
          ReconciliacaoService.executarAcao(treinoRealizadoId, {
            action,
            treinoPlanejadoId,
          })
        );
        // Remove atividade da lista após sucesso
        setActivities((prev) => prev.filter((a) => a.id !== treinoRealizadoId));
        // Limpar cache de candidatos
        delete candidatosRef.current[treinoRealizadoId];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao executar ação';
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === treinoRealizadoId
              ? { ...activity, isSubmitting: false, error: message }
              : activity
          )
        );
      }
    },
    []
  );

  return {
    atletaId,
    setAtletaId,
    filtros,
    updateFiltros,
    page,
    setPage,
    activities,
    totalPages,
    loading,
    error,
    toggleExpanded,
    getCandidatos,
    executarAcao,
  };
}
