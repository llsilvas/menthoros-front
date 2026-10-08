import { useEffect, useState } from 'react';
import { FoundersSlotsService } from '../services/FoundersSlotsService';
import type { FoundersSlots } from '../types/FoundersSlots';

export interface UseFoundersSlotsResult {
  data: FoundersSlots | null;
  loading: boolean;
  error: boolean;
}

/**
 * Busca as vagas da turma fundadora uma vez por carregamento de página — sem polling, o cache de
 * ~30s do backend já mantém o dado razoavelmente fresco. Falha vira `error: true`, nunca um
 * número inventado: quem consome decide o texto a exibir (ver `foundersSlotsLabel`).
 */
export function useFoundersSlots(): UseFoundersSlotsResult {
  const [data, setData] = useState<FoundersSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      try {
        const vagas = await FoundersSlotsService.obterVagas();
        if (!cancelado) {
          setData(vagas);
          setLoading(false);
        }
      } catch {
        if (!cancelado) {
          setError(true);
          setLoading(false);
        }
      }
    };

    void carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  return { data, loading, error };
}
