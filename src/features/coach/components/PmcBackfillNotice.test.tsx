import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PmcBackfillNotice } from './PmcBackfillNotice';

describe('PmcBackfillNotice', () => {
    it('mostra o aviso de histórico recalculado', () => {
        render(<PmcBackfillNotice onDismiss={vi.fn()} />);

        expect(screen.getByText('Histórico de PMC atualizado')).toBeInTheDocument();
    });

    it('chama onDismiss ao fechar o aviso', async () => {
        const onDismiss = vi.fn();
        render(<PmcBackfillNotice onDismiss={onDismiss} />);

        await userEvent.click(screen.getByRole('button', { name: /close/i }));

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
