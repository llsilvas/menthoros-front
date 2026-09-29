import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { KPICard } from './KPICard';

// Teste de caracterização (standardize-card-foundation, PM5) — KPICard não tinha teste antes desta
// change. Fixa o comportamento atual como rede de segurança para a migração ao Card compartilhado
// (task 5.1b): Tooltip condicional no label e padding diferente na variante isHero.
describe('KPICard (caracterização)', () => {
    it('sem tooltip: não mostra role="tooltip" ao passar o mouse sobre o label', async () => {
        render(<KPICard label="Aderência" value={82} unit="%" />);
        await userEvent.hover(screen.getByText('Aderência'));
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('com tooltip: mostra o texto do tooltip ao passar o mouse sobre o label', async () => {
        render(<KPICard label="Aderência" value={82} unit="%" tooltip="Últimas 4 semanas completas" />);
        await userEvent.hover(screen.getByText('Aderência'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Últimas 4 semanas completas');
    });

    it('emphasis="hero": padding 3 (24px) no card raiz', () => {
        const { container } = render(<KPICard label="Volume" value={42} emphasis="hero" />);
        const card = container.firstElementChild as HTMLElement;
        expect(getComputedStyle(card).padding).toBe('24px');
    });

    it('emphasis="normal" (default): padding 2 (16px) no card raiz', () => {
        const { container } = render(<KPICard label="Volume" value={42} />);
        const card = container.firstElementChild as HTMLElement;
        expect(getComputedStyle(card).padding).toBe('16px');
    });

    it('renderiza value e unit', () => {
        render(<KPICard label="Aderência" value={82} unit="%" />);
        expect(screen.getByText('82')).toBeInTheDocument();
        expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('loading: mostra skeleton em vez do valor', () => {
        render(<KPICard label="Aderência" value={82} loading />);
        expect(screen.queryByText('82')).not.toBeInTheDocument();
    });
});
