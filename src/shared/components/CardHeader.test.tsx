import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardHeader } from './CardHeader';

describe('CardHeader', () => {
    it('título como string aparece', () => {
        render(<CardHeader title="Diagnóstico" />);
        expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
    });

    it('título como ReactNode (ex.: composto com Tooltip) aparece', () => {
        render(<CardHeader title={<span data-testid="titulo-composto">Label com tooltip</span>} />);
        expect(screen.getByTestId('titulo-composto')).toBeInTheDocument();
        expect(screen.getByText('Label com tooltip')).toBeInTheDocument();
    });

    it('sem subtitle/icon/action: só o título aparece, sem espaço reservado vazio', () => {
        render(<CardHeader title="Só título" />);
        expect(screen.getByText('Só título')).toBeInTheDocument();
        expect(screen.queryByTestId('card-header-action')).not.toBeInTheDocument();
    });

    it('subtitle presente aparece', () => {
        render(<CardHeader title="X" subtitle="explica o que o card mostra" />);
        expect(screen.getByText('explica o que o card mostra')).toBeInTheDocument();
    });

    it('icon presente aparece', () => {
        render(<CardHeader title="X" icon={<span data-testid="icone">🏃</span>} />);
        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });

    it('action presente aparece', () => {
        render(<CardHeader title="X" action={<button type="button">Ver mais</button>} />);
        expect(screen.getByRole('button', { name: 'Ver mais' })).toBeInTheDocument();
    });

    it('divider=true marca o header com data-divider; default (false) não marca', () => {
        const { rerender } = render(<CardHeader title="X" divider />);
        expect(screen.getByTestId('card-header')).toHaveAttribute('data-divider', 'true');

        rerender(<CardHeader title="X" />);
        expect(screen.getByTestId('card-header')).toHaveAttribute('data-divider', 'false');
    });
});
