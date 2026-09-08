import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { BatchPlanJobStatus } from '../../../types/BatchPlanJob';
import type { PlanGenerationEntry, PlanGenerationReadable } from './planGenerationStore';

/**
 * Contexto + hooks da geração de plano no nível do coach. Separado do Provider (`.tsx`) porque o
 * lint (`react-refresh/only-export-components`) não deixa um arquivo exportar componente e hooks
 * juntos. O Provider importa o `PlanGenerationContext` daqui.
 *
 * O `nullStore` é o valor default: telas SEM o provider (ex.: a tela legada `AtletasList`) continuam
 * funcionando — `iniciar` devolve `true` (não bloqueia) e as demais ações são no-op, então o
 * PlanosDialog cai no fluxo local do `useBatchPlanGeneration`.
 */
export interface PlanGenerationContextValue extends PlanGenerationReadable {
    /** true no provider real; false no `nullStore` (telas sem provider, ex.: AtletasList legada). */
    readonly hasProvider: boolean;
    iniciar(atletaId: string): boolean;
    iniciarLote(atletaIds: string[]): string[];
    anexarJob(atletaId: string, jobId: string): void;
    anexarJobLote(atletaIds: string[], jobId: string): void;
    liberar(atletaId: string): void;
    liberarLote(atletaIds: string[]): void;
    setOnPlanoGerado(cb?: () => void): void;
}

const nullStore: PlanGenerationContextValue = {
    hasProvider: false,
    subscribe: () => () => {},
    getEntry: () => undefined,
    getJobStatus: () => null,
    iniciar: () => true,
    iniciarLote: (ids) => ids,
    anexarJob: () => {},
    anexarJobLote: () => {},
    liberar: () => {},
    liberarLote: () => {},
    setOnPlanoGerado: () => {},
};

export const PlanGenerationContext = createContext<PlanGenerationContextValue>(nullStore);

/** Ações do disparo (usadas pelo PlanosDialog). Tolera ausência do provider (nullStore). */
export function usePlanGenerationActions(): PlanGenerationContextValue {
    return useContext(PlanGenerationContext);
}

/**
 * Leitura seletiva por atleta. Graças ao `useSyncExternalStore` + referência estável de entrada,
 * uma linha só re-renderiza quando a SUA entrada muda — o tick de outro atleta não a afeta.
 */
export function useAtletaPlanGeneration(atletaId: string): PlanGenerationEntry | undefined {
    const store = useContext(PlanGenerationContext);
    return useSyncExternalStore(store.subscribe, () => store.getEntry(atletaId));
}

/** Progresso agregado de um job (para o BatchPlanDialog). null fora do provider ou job desconhecido. */
export function useJobProgress(jobId: string | null): BatchPlanJobStatus | null {
    const store = useContext(PlanGenerationContext);
    return useSyncExternalStore(store.subscribe, () => (jobId ? store.getJobStatus(jobId) : null));
}

/** Registra a recarga a disparar no terminal de sucesso (ex.: fetchRoster), independente do dialog. */
export function useRegisterPlanGenerationReload(reload: () => void): void {
    const store = useContext(PlanGenerationContext);
    useEffect(() => {
        store.setOnPlanoGerado(reload);
        return () => store.setOnPlanoGerado(undefined);
    }, [store, reload]);
}
