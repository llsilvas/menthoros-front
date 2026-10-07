import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkoutVerdictChip } from './WorkoutVerdictChip';

describe('WorkoutVerdictChip', () => {
    it('renderiza o rótulo e o data-testid do contrato', () => {
        render(<WorkoutVerdictChip verdict={{ label: 'Dentro do plano', tone: 'success' }} />);

        const chip = screen.getByTestId('workout-verdict-chip');
        expect(chip).toHaveTextContent('Dentro do plano');
    });

    it('tom warning renderiza o mesmo rótulo recebido, sem recalcular nada', () => {
        render(<WorkoutVerdictChip verdict={{ label: 'Esforço acima do esperado', tone: 'warning' }} />);

        expect(screen.getByTestId('workout-verdict-chip')).toHaveTextContent('Esforço acima do esperado');
    });

    it('comunica o estado por texto, não só por cor — o texto do rótulo está sempre no DOM', () => {
        render(<WorkoutVerdictChip verdict={{ label: 'Acima do plano', tone: 'warning' }} />);

        expect(screen.getByText('Acima do plano')).toBeVisible();
    });
});
