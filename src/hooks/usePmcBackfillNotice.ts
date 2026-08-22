import { useCallback, useState } from 'react';

const STORAGE_KEY = 'menthoros:pmc:backfillNoticeDismissed';

/**
 * `localStorage` pode lançar em ambientes que o bloqueiam (iframes sandboxed, alguns modos
 * privados) — degrada para "nunca dispensado" em vez de quebrar a tela de PMC (mesmo padrão de
 * `useCalibracao`).
 */
function lerDispensado(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function gravarDispensado(): void {
    try {
        localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
        // Sem persistência disponível — o banner reaparece na próxima visita nesta sessão,
        // degradação aceitável (o aviso em si não é crítico).
    }
}

/**
 * Aviso in-app (task 6.2b, `ingestao-treino-realizado`) de que o backfill de
 * `recalcularHistoricoCompleto` mudou valores históricos de PMC — treinos cancelados saem da
 * carga e TSS de dispositivo passa a ser respeitado. Sem isso, o coach vê o gráfico de datas
 * passadas mudar sem nenhuma ação sua e pode ler como bug.
 *
 * Deliberadamente simples: banner global, sem flag por tenant no backend (decisão registrada em
 * `design.md`/`proposal.md` dessa change — "nota in-app simples"). **Remover este hook e o
 * `PmcBackfillNotice` depois que o backfill rodar em produção e o aviso já tiver circulado por um
 * tempo razoável** — não há expiração automática por código.
 */
export function usePmcBackfillNotice() {
    const [dismissed, setDismissed] = useState(lerDispensado);

    const dismiss = useCallback(() => {
        gravarDispensado();
        setDismissed(true);
    }, []);

    return { dismissed, dismiss };
}
