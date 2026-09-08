import { Profiler, type ReactNode } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanGenerationProvider } from './PlanGenerationProvider';
import { usePlanGenerationActions } from './planGenerationContext';
import { AthleteNameCell } from '../components/AthleteNameCell';
import type { PlanGenerationContextValue } from './planGenerationContext';

/**
 * 3.2 — assinatura seletiva com o PROVIDER real: ao mudar o estado de UM atleta, só a célula
 * daquele atleta re-renderiza; as demais linhas não são afetadas pelo tick (evita re-render do
 * roster inteiro a cada polling).
 */
describe('Render seletivo por atleta (provider real)', () => {
    it('mudar o estado de a1 não re-renderiza a célula de a2', () => {
        let actions: PlanGenerationContextValue | null = null;
        const Grab = (): ReactNode => {
            actions = usePlanGenerationActions();
            return null;
        };

        const renders: Record<string, number> = { a1: 0, a2: 0 };
        const onRender = (id: string) => () => {
            renders[id] += 1;
        };

        render(
            <PlanGenerationProvider>
                <Grab />
                <Profiler id="a1" onRender={onRender('a1')}>
                    <AthleteNameCell id="a1" name="Ana" />
                </Profiler>
                <Profiler id="a2" onRender={onRender('a2')}>
                    <AthleteNameCell id="a2" name="Bruno" />
                </Profiler>
            </PlanGenerationProvider>,
        );

        const a2Base = renders.a2;
        const a1Base = renders.a1;

        act(() => {
            actions!.iniciar('a1');
        });

        expect(renders.a1).toBeGreaterThan(a1Base); // a linha de a1 reagiu
        expect(renders.a2).toBe(a2Base); // a linha de a2 NÃO re-renderizou
    });
});
