import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlanosDialog from './planosDialog';
import { usePlanoSemanal } from '../../../hooks/usePlanoSemanal';

vi.mock('../../../hooks/usePlanoSemanal');
vi.mock('../../../api/services/AtletasService');
vi.mock('../../../api/services/TreinoService');

type HookReturn = ReturnType<typeof usePlanoSemanal>;

const mockHook = (over: Partial<HookReturn>): void => {
    vi.mocked(usePlanoSemanal).mockReturnValue({
        planos: [],
        loading: false,
        error: null,
        fetchPlanosPorAtleta: vi.fn().mockResolvedValue(undefined),
        gerarPlanoSemanal: vi.fn().mockResolvedValue(undefined),
        deletePlano: vi.fn().mockResolvedValue(undefined),
        clearError: vi.fn(),
        clearPlanos: vi.fn(),
        ...over,
    });
};

describe('PlanosDialog — geração de plano', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('avisa o pai via onPlanoGerado depois que a geração conclui', async () => {
        const gerarPlanoSemanal = vi.fn().mockResolvedValue(undefined);
        mockHook({ gerarPlanoSemanal });
        const onPlanoGerado = vi.fn();

        render(
            <PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" onPlanoGerado={onPlanoGerado} />,
        );

        await userEvent.click(screen.getByRole('button', { name: /gerar plano/i }));

        await waitFor(() => expect(onPlanoGerado).toHaveBeenCalledTimes(1));
        expect(gerarPlanoSemanal).toHaveBeenCalledWith('a1', 'PROXIMA_SEMANA');
    });

    it('não avisa o pai quando a geração falha', async () => {
        mockHook({ gerarPlanoSemanal: vi.fn().mockRejectedValue(new Error('boom')) });
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const onPlanoGerado = vi.fn();

        render(
            <PlanosDialog open onClose={vi.fn()} atletaId="a1" atletaNome="Ana" onPlanoGerado={onPlanoGerado} />,
        );

        await userEvent.click(screen.getByRole('button', { name: /gerar plano/i }));

        await waitFor(() => expect(console.error).toHaveBeenCalled());
        expect(onPlanoGerado).not.toHaveBeenCalled();
    });
});
