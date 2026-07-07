import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import DecouplingBadge from './DecouplingBadge';
import { decouplingTone, decouplingLabel } from './decouplingReading';

describe('decouplingTone', () => {
    it('< 5 (inclui negativos) → success', () => {
        expect(decouplingTone(-7.8)).toBe('success');
        expect(decouplingTone(0)).toBe('success');
        expect(decouplingTone(4.9)).toBe('success');
    });

    it('[5, 10] (fronteiras inclusive) → warning', () => {
        expect(decouplingTone(5)).toBe('warning');
        expect(decouplingTone(7.5)).toBe('warning');
        expect(decouplingTone(10)).toBe('warning');
    });

    it('> 10 → danger', () => {
        expect(decouplingTone(10.1)).toBe('danger');
        expect(decouplingTone(20)).toBe('danger');
    });
});

describe('decouplingLabel', () => {
    it('faixa por fronteira → frase descritiva (não-causal)', () => {
        expect(decouplingLabel(-7.8)).toMatch(/bem sustentada/i);
        expect(decouplingLabel(4.9)).toMatch(/bem sustentada/i);
        expect(decouplingLabel(5)).toMatch(/caindo na 2ª metade/i);
        expect(decouplingLabel(10)).toMatch(/caindo na 2ª metade/i);
        expect(decouplingLabel(10.1)).toMatch(/acentuada/i);
    });
});

describe('DecouplingBadge', () => {
    it('mostra o % e a leitura para um número', () => {
        render(<DecouplingBadge value={4.2} />);
        expect(screen.getByText(/4\.2%/)).toBeInTheDocument();
        expect(screen.getByText(/bem sustentada/i)).toBeInTheDocument();
    });

    it('formata negativo como eficiência sustentada', () => {
        render(<DecouplingBadge value={-7.8} />);
        expect(screen.getByText(/-7\.8%/)).toBeInTheDocument();
        expect(screen.getByText(/bem sustentada/i)).toBeInTheDocument();
    });

    it('fronteira 5.0 → âmbar/caindo; 12 → acentuada', () => {
        const { unmount } = render(<DecouplingBadge value={5} />);
        expect(screen.getByText(/5\.0%/)).toBeInTheDocument();
        expect(screen.getByText(/caindo na 2ª metade/i)).toBeInTheDocument();
        unmount();
        render(<DecouplingBadge value={12} />);
        expect(screen.getByText(/acentuada/i)).toBeInTheDocument();
    });

    it('estado "n/d" para null (sem número)', () => {
        render(<DecouplingBadge value={null} />);
        expect(screen.getByText(/n\/d/i)).toBeInTheDocument();
        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    it('estado "n/d" para undefined (idêntico a null)', () => {
        render(<DecouplingBadge value={undefined} />);
        expect(screen.getByText(/n\/d/i)).toBeInTheDocument();
    });

    it('tooltip "n/d" indica dados insuficientes', async () => {
        render(<DecouplingBadge value={null} />);
        await userEvent.hover(screen.getByText(/n\/d/i));
        expect(await screen.findByRole('tooltip')).toHaveTextContent(/dados suficientes/i);
    });

    it('tooltip marca que é estimativa', async () => {
        render(<DecouplingBadge value={4.2} />);
        await userEvent.hover(screen.getByText(/4\.2%/));
        expect(await screen.findByRole('tooltip')).toHaveTextContent(/estimativa/i);
    });
});
