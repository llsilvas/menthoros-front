import { useEffect, useRef, type ReactNode } from 'react';
import { PlanGenerationStore } from './planGenerationStore';
import { PlanGenerationContext } from './planGenerationContext';

/**
 * Monta o store da geração de plano no nível do coach (ver CoachLayout). O estado é em memória:
 * desmontar o shell do coach (navegar para fora) ou recarregar a página zera tudo — o job segue no
 * servidor. Ver `planGenerationStore.ts` e `planGenerationContext.ts`.
 */
export function PlanGenerationProvider({ children }: { children: ReactNode }) {
    const ref = useRef<PlanGenerationStore | null>(null);
    if (ref.current === null) ref.current = new PlanGenerationStore();
    const store = ref.current;
    useEffect(() => () => store.dispose(), [store]);
    return <PlanGenerationContext.Provider value={store}>{children}</PlanGenerationContext.Provider>;
}
