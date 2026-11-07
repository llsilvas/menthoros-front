import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';
import { EtapasEditor } from './EtapasEditor';
import { emptyBlock, emptyStep, reordenar, type EtapaItem } from './etapaItem';

// O arrasto real depende de geometria (getBoundingClientRect) que o jsdom não tem. O que o editor
// decide fica em `reordenar` e em `onDragEnd`; o `DndContext` é substituído por um que expõe o
// handler, e o gesto em si fica para o E2E.
let aoSoltar: ((e: DragEndEvent) => void) | undefined;
vi.mock('@dnd-kit/core', async importOriginal => {
    const real = await importOriginal<typeof import('@dnd-kit/core')>();
    return {
        ...real,
        DndContext: (props: { onDragEnd?: (e: DragEndEvent) => void; children?: React.ReactNode }) => {
            aoSoltar = props.onDragEnd;
            return <>{props.children}</>;
        },
    };
});

const step = (id: string, tipoEtapa: string): EtapaItem => ({ ...emptyStep(), id, tipoEtapa });
const bloco = (id: string): EtapaItem => ({ ...emptyBlock(), id });

function Harness({ inicial, disabled, espiao }: { inicial: EtapaItem[]; disabled?: boolean; espiao?: () => void }) {
    const [itens, setItens] = useState(inicial);
    return (
        <EtapasEditor
            itens={itens}
            disabled={disabled}
            onChange={fn => { espiao?.(); setItens(fn); }}
        />
    );
}

const ordemDosTipos = () =>
    screen.getAllByLabelText(/^Tipo da etapa \d$/).map(el => (el as HTMLSelectElement).value);

const soltar = (activeId: string, overId: string | null) =>
    act(() => aoSoltar?.({
        active: { id: activeId },
        over: overId ? { id: overId } : null,
    } as unknown as DragEndEvent));

describe('reordenar — ordem do array após soltar', () => {
    const a = step('a', 'AQUECIMENTO');
    const b = step('b', 'INTERVALADO');
    const c = step('c', 'DESAQUECIMENTO');

    it('CA1: soltar C sobre A põe C no topo e desloca os outros (inserção, não troca)', () => {
        expect(reordenar([a, b, c], 'c', 'a').map(i => i.id)).toEqual(['c', 'a', 'b']);
    });

    it('CA2: um bloco move inteiro, com as sub-etapas', () => {
        const serie = bloco('s');
        const resultado = reordenar([a, serie, c], 's', 'a');
        expect(resultado.map(i => i.id)).toEqual(['s', 'a', 'c']);
        expect(resultado[0]).toBe(serie);
    });

    it('CA7: mesmo id ou id desconhecido devolvem o mesmo array', () => {
        const lista = [a, b, c];
        expect(reordenar(lista, 'b', 'b')).toBe(lista);
        expect(reordenar(lista, 'x', 'a')).toBe(lista);
        expect(reordenar(lista, 'a', 'x')).toBe(lista);
    });
});

describe('EtapasEditor — arrastar e soltar (coach-reordenar-etapas-dnd)', () => {
    it('cada item do nível raiz tem alça; sub-etapas não', () => {
        render(<Harness inicial={[step('a', 'AQUECIMENTO'), bloco('s')]} />);
        expect(screen.getByRole('button', { name: 'Arrastar etapa 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Arrastar série 2' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Arrastar etapa \d da série/ })).not.toBeInTheDocument();
    });

    it('CA5: disabled desliga a alça', () => {
        render(<Harness inicial={[step('a', 'AQUECIMENTO'), step('b', 'INTERVALADO')]} disabled />);
        expect(screen.getByRole('button', { name: 'Arrastar etapa 1' })).toBeDisabled();
    });

    it('CA1: soltar a terceira sobre a primeira reordena a lista na tela', () => {
        render(<Harness inicial={[step('a', 'AQUECIMENTO'), step('b', 'INTERVALADO'), step('c', 'DESAQUECIMENTO')]} />);
        expect(ordemDosTipos()).toEqual(['AQUECIMENTO', 'INTERVALADO', 'DESAQUECIMENTO']);

        soltar('c', 'a');

        expect(ordemDosTipos()).toEqual(['DESAQUECIMENTO', 'AQUECIMENTO', 'INTERVALADO']);
    });

    it('CA7: soltar sem destino ou no mesmo lugar não chama onChange', () => {
        const espiao = vi.fn();
        render(<Harness inicial={[step('a', 'AQUECIMENTO'), step('b', 'INTERVALADO')]} espiao={espiao} />);

        soltar('a', null);
        soltar('a', 'a');

        expect(espiao).not.toHaveBeenCalled();
        expect(ordemDosTipos()).toEqual(['AQUECIMENTO', 'INTERVALADO']);
    });

    it('CA3: setas e arrasto produzem a mesma ordem', async () => {
        const user = userEvent.setup();
        const inicial = [step('a', 'AQUECIMENTO'), step('b', 'INTERVALADO'), step('c', 'DESAQUECIMENTO')];
        render(<Harness inicial={inicial} />);

        await user.click(screen.getByRole('button', { name: 'Mover etapa 3 para cima' }));
        await user.click(screen.getByRole('button', { name: 'Mover etapa 2 para cima' }));

        const porSetas = ordemDosTipos();
        const porArrasto = reordenar(inicial, 'c', 'a').map(i => (i as { tipoEtapa: string }).tipoEtapa);
        expect(porSetas).toEqual(porArrasto);
    });
});
