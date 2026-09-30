import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';
import { buildCardSx } from './cardStyles';
import type { BuildCardSxArgs } from './cardStyles';
import { elevation, surface } from '../design-tokens';
import { content, glassSx, semantic } from '../../theme/tokens';
import { radius } from '../design-tokens/density';

// buildCardSx é tipado como SxProps<Theme> para o consumidor real (Card.tsx) — union do MUI que
// inclui função/array e não permite acesso de propriedade direto. Aqui, só para inspecionar o
// objeto de estilo nos testes, tratamos o retorno como o Record simples que ele de fato é.
function sxOf(args: Partial<BuildCardSxArgs> & Pick<BuildCardSxArgs, 'variant'>): Record<string, unknown> {
    return buildCardSx({ isInteractive: false, padding: 2, ...args }) as Record<string, unknown>;
}

describe('buildCardSx', () => {
    it('variante flat: fundo elevation.card, borda content.cardBorder, radius.lg, sem boxShadow', () => {
        const sx = sxOf({ variant: 'flat' });
        expect(sx.backgroundColor).toBe(elevation.card);
        expect(sx.border).toBe(`1px solid ${content.cardBorder}`);
        expect(sx.borderRadius).toBe(radius.lg);
        expect(sx.boxShadow).toBeUndefined();
    });

    it('variante glass: spread de glassSx', () => {
        const sx = sxOf({ variant: 'glass' });
        expect(sx.backgroundColor).toBe(glassSx.backgroundColor);
        expect(sx.border).toBe(glassSx.border);
        expect(sx.boxShadow).toBe(glassSx.boxShadow);
    });

    it('variante solid: fundo elevation.card (default) e borda sólida surface[700]', () => {
        const sx = sxOf({ variant: 'solid' });
        expect(sx.backgroundColor).toBe(elevation.card);
        expect(sx.border).toBe(`1px solid ${surface[700]}`);
        expect(sx.borderRadius).toBe(radius.lg);
    });

    it('variante solid + surfaceLevel="panel": fundo elevation.panel (TodayHeroCard e família)', () => {
        const sx = sxOf({ variant: 'solid', surfaceLevel: 'panel' });
        expect(sx.backgroundColor).toBe(elevation.panel);
        expect(sx.border).toBe(`1px solid ${surface[700]}`);
    });

    it('padding: default 2, aceita override', () => {
        expect(sxOf({ variant: 'flat' }).padding).toBe(2);
        expect(sxOf({ variant: 'flat', padding: 3 }).padding).toBe(3);
    });

    it('transition sempre presente (restaura o comportamento de StatCard/AssessmentInfoCard pré-migração)', () => {
        expect(sxOf({ variant: 'flat' }).transition).toBeDefined();
        expect(sxOf({ variant: 'glass' }).transition).toBeDefined();
    });

    it('sem interactive/onClick: nenhum estilo de :hover', () => {
        const sx = sxOf({ variant: 'flat' });
        expect(sx['&:hover']).toBeUndefined();
    });

    it('interactive true: cursor pointer e :hover aplicado', () => {
        const sx = sxOf({ variant: 'flat', isInteractive: true });
        expect(sx.cursor).toBe('pointer');
        expect(sx['&:hover']).toBeDefined();
    });

    it('stateColor: borda 2px e fundo tingido via alpha, sem concatenação de string', () => {
        const sx = sxOf({ variant: 'glass', stateColor: 'success' });
        expect(sx.border).toBe(`2px solid ${semantic.success[500]}`);
        expect(sx.backgroundColor).not.toContain('40'); // não é a string antiga `${hex}40`
        expect(sx.backgroundColor).toMatch(/^rgba\(/);
    });

    it('stateColor + interactive: hover não sobrescreve background/border, só cursor (PM6)', () => {
        const withState = sxOf({ variant: 'glass', stateColor: 'danger', isInteractive: true });
        expect(withState.cursor).toBe('pointer');
        expect(withState['&:hover']).toBeUndefined();
        // a cor de estado permanece a mesma independentemente de interactive
        const withoutInteractive = sxOf({ variant: 'glass', stateColor: 'danger' });
        expect(withState.border).toBe(withoutInteractive.border);
        expect(withState.backgroundColor).toBe(withoutInteractive.backgroundColor);
    });
});

describe('Card', () => {
    it('renderiza os children', () => {
        render(<Card>conteúdo do card</Card>);
        expect(screen.getByText('conteúdo do card')).toBeInTheDocument();
    });

    it('component="section" + aria-label produz landmark region (CA9)', () => {
        render(
            <Card component="section" aria-label="Diagnóstico">
                conteúdo
            </Card>,
        );
        expect(screen.getByRole('region', { name: 'Diagnóstico' })).toBeInTheDocument();
    });

    it('onClick dispara ao clicar', async () => {
        const onClick = vi.fn();
        render(<Card onClick={onClick}>clicável</Card>);
        screen.getByText('clicável').click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('onClick presente sem `interactive`: cursor pointer mesmo assim', () => {
        const { container } = render(<Card onClick={() => {}}>clicável</Card>);
        expect(getComputedStyle(container.firstElementChild as HTMLElement).cursor).toBe('pointer');
    });

    it('data-testid é repassado ao elemento raiz', () => {
        render(<Card data-testid="meu-card">conteúdo</Card>);
        expect(screen.getByTestId('meu-card')).toBeInTheDocument();
    });
});
