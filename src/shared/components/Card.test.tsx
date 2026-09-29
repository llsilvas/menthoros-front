import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card';
import { buildCardSx } from './cardStyles';
import { elevation } from '../design-tokens';
import { content, glassSx, semantic } from '../../theme/tokens';
import { radius } from '../design-tokens/density';

describe('buildCardSx', () => {
    it('variante flat: fundo elevation.card, borda content.cardBorder, radius.lg, sem boxShadow', () => {
        const sx = buildCardSx({ variant: 'flat' });
        expect(sx.backgroundColor).toBe(elevation.card);
        expect(sx.border).toBe(`1px solid ${content.cardBorder}`);
        expect(sx.borderRadius).toBe(radius.lg);
        expect(sx.boxShadow).toBeUndefined();
    });

    it('variante glass: spread de glassSx', () => {
        const sx = buildCardSx({ variant: 'glass' });
        expect(sx.backgroundColor).toBe(glassSx.backgroundColor);
        expect(sx.border).toBe(glassSx.border);
        expect(sx.boxShadow).toBe(glassSx.boxShadow);
    });

    it('padding: default 2, aceita override', () => {
        expect(buildCardSx({}).padding).toBe(2);
        expect(buildCardSx({ padding: 3 }).padding).toBe(3);
    });

    it('sem interactive/onClick: nenhum estilo de :hover', () => {
        const sx = buildCardSx({ variant: 'flat' });
        expect(sx['&:hover']).toBeUndefined();
    });

    it('interactive true: cursor pointer e :hover aplicado', () => {
        const sx = buildCardSx({ variant: 'flat', interactive: true });
        expect(sx.cursor).toBe('pointer');
        expect(sx['&:hover']).toBeDefined();
    });

    it('onClick presente: implica interactive mesmo sem a prop', () => {
        const sx = buildCardSx({ variant: 'glass', onClick: () => {} });
        expect(sx.cursor).toBe('pointer');
        expect(sx['&:hover']).toBeDefined();
    });

    it('stateColor: borda 2px e fundo tingido via alpha, sem concatenação de string', () => {
        const sx = buildCardSx({ variant: 'glass', stateColor: 'success' });
        expect(sx.border).toBe(`2px solid ${semantic.success[500]}`);
        expect(sx.backgroundColor).not.toContain('40'); // não é a string antiga `${hex}40`
        expect(sx.backgroundColor).toMatch(/^rgba\(/);
    });

    it('stateColor + interactive: hover não sobrescreve background/border, só cursor (PM6)', () => {
        const withState = buildCardSx({ variant: 'glass', stateColor: 'danger', interactive: true });
        expect(withState.cursor).toBe('pointer');
        expect(withState['&:hover']).toBeUndefined();
        // a cor de estado permanece a mesma independentemente de interactive
        const withoutInteractive = buildCardSx({ variant: 'glass', stateColor: 'danger' });
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

    it('data-testid é repassado ao elemento raiz', () => {
        render(<Card data-testid="meu-card">conteúdo</Card>);
        expect(screen.getByTestId('meu-card')).toBeInTheDocument();
    });
});
