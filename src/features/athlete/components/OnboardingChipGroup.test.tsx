import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const OPTIONS = ['A', 'B', 'C'] as const;
const LABELS: Record<(typeof OPTIONS)[number], string> = { A: 'Alfa', B: 'Beta', C: 'Gama' };

describe('OnboardingChipGroup', () => {
    it('renderiza role="radiogroup" por padrão (single-select)', () => {
        render(<OnboardingChipGroup label="Escolha" options={OPTIONS} labels={LABELS} selected="A" onSelect={vi.fn()} />);

        expect(screen.getByRole('radiogroup', { name: 'Escolha' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Alfa' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'false');
    });

    it('renderiza role="group" com checkbox quando multi=true', () => {
        render(<OnboardingChipGroup label="Escolha" options={OPTIONS} labels={LABELS} selected={['A', 'C']} onSelect={vi.fn()} multi />);

        expect(screen.getByRole('group', { name: 'Escolha' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Alfa' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('checkbox', { name: 'Beta' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('checkbox', { name: 'Gama' })).toHaveAttribute('aria-checked', 'true');
    });

    it('chama onSelect com a opção clicada', async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        render(<OnboardingChipGroup label="Escolha" options={OPTIONS} labels={LABELS} selected="A" onSelect={onSelect} />);

        await user.click(screen.getByText('Beta'));

        expect(onSelect).toHaveBeenCalledWith('B');
    });

    it('nenhuma opção marcada quando selected é undefined', () => {
        render(<OnboardingChipGroup label="Escolha" options={OPTIONS} labels={LABELS} selected={undefined} onSelect={vi.fn()} />);

        expect(screen.getByRole('radio', { name: 'Alfa' })).toHaveAttribute('aria-checked', 'false');
    });
});
