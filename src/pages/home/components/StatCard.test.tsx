import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StatCard from './StatCard';

// Teste de caracterização (standardize-card-foundation, PM5) — StatCard não tinha teste antes desta
// change. Fixa o comportamento atual como rede de segurança para a migração ao Card compartilhado
// (task 5.2b): clique dispara o callback uma vez, cursor muda conforme onClick está presente.
describe('StatCard (caracterização)', () => {
    it('com onClick: clique dispara o callback exatamente uma vez', () => {
        const onClick = vi.fn();
        const { container } = render(<StatCard icon={<span />} label="Atletas ativos" value={12} onClick={onClick} />);

        (container.firstElementChild as HTMLElement).dispatchEvent(
            new MouseEvent('click', { bubbles: true }),
        );

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('com onClick: cursor pointer', () => {
        const { container } = render(<StatCard icon={<span />} label="Atletas ativos" value={12} onClick={() => {}} />);
        expect(getComputedStyle(container.firstElementChild as HTMLElement).cursor).toBe('pointer');
    });

    it('sem onClick: sem cursor pointer', () => {
        const { container } = render(<StatCard icon={<span />} label="Atletas ativos" value={12} />);
        expect(getComputedStyle(container.firstElementChild as HTMLElement).cursor).not.toBe('pointer');
    });

    it('renderiza icon, value e label', () => {
        render(<StatCard icon={<span data-testid="icone" />} label="Atletas ativos" value={12} />);
        expect(screen.getByTestId('icone')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('Atletas ativos')).toBeInTheDocument();
    });
});
