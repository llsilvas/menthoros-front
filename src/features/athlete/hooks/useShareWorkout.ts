import { useCallback, useState } from 'react';
import { ApiError } from '../../../api/core/ApiError';
import { ManualTrainingService } from '../../../api/services/ManualTrainingService';
import { PlanoSemanalService } from '../../../api/services/PlanoSemanalService';
import { UsuarioService } from '../../../api/services/UsuarioService';
import type { GpsTrace, TreinoRealizadoDto } from '../../../types/TreinoManual';
import type { PlanoSemanal } from '../../../types/PlanoSemanal';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';
import { buildShareCardData } from '../adapters/buildShareCardData';
import type { ShareCardData } from '../types/ShareCard';

/** Janela da listagem do atleta (máx. do backend); treino mais antigo cai em "não encontrado" (D1). */
const JANELA_DIAS = 30;

/**
 * Dados dos cards de compartilhamento de um treino realizado (athlete-share-cards, D1): lista
 * recente do atleta, planejado vinculado (se o treino veio do plano) e a assessoria do usuário.
 */
export function useShareWorkout(treinoId: string | undefined) {
  const [data, setData] = useState<ShareCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    if (!treinoId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      const [me, recentes] = await Promise.all([
        UsuarioService.getMe(),
        ManualTrainingService.listarRecentes(JANELA_DIAS),
      ]);
      const realizado = recentes.find((t: TreinoRealizadoDto) => t.id === treinoId);
      if (!realizado) {
        setData(null);
        setNotFound(true);
        return;
      }
      const [planejado, gpsTrace] = await Promise.all([
        me.atletaId ? buscarPlanejado(me.atletaId, treinoId) : Promise.resolve(null),
        realizado.temTrajeto ? buscarTrajeto(treinoId) : Promise.resolve(null),
      ]);
      setData(buildShareCardData({
        realizado,
        planejado,
        recentes,
        assessoriaNome: me.assessoria?.nome ?? null,
        gpsTrace,
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar o treino'));
    } finally {
      setLoading(false);
    }
  }, [treinoId]);

  return { data, loading, error, notFound, fetchData };
}

/** O mapa é aditivo: sem trajeto os modelos com mapa somem e o resto da tela continua (D6). */
async function buscarTrajeto(treinoId: string): Promise<GpsTrace | null> {
  try {
    return await ManualTrainingService.getTrajeto(treinoId);
  } catch {
    return null;
  }
}

/** Planejado cujo realizado é este treino; sem plano aprovado (404) é só "sem planejado". */
async function buscarPlanejado(atletaId: string, treinoId: string): Promise<TreinoPlanejado | null> {
  try {
    const resposta: PlanoSemanal | PlanoSemanal[] | null = await PlanoSemanalService.listarPlanosPorAtleta(atletaId);
    // O backend pode devolver um plano só em vez de lista — mesma tolerância de `selectAthletePlan`.
    const planos = resposta == null ? [] : Array.isArray(resposta) ? resposta : [resposta];
    for (const plano of planos) {
      const achado = plano.treinosPlanejados?.find((t) => t.treinoRealizadoId === treinoId);
      if (achado) return achado;
    }
    return null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
