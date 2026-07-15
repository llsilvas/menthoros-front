import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { SyncStatusChip } from './SyncStatusChip';

describe('SyncStatusChip', () => {
    describe.each([
        // [statusSincronizacao, atletaConectado, textoEsperado]
        ['SINCRONIZADO', true, 'No relógio'],
        ['SINCRONIZADO_PARCIAL', true, 'No relógio'],
        ['ERRO_TEMPORARIO', true, 'Erro no envio'],
        ['ERRO_AUTENTICACAO', true, 'Erro no envio'],
        ['ERRO_VALIDACAO', true, 'Erro no envio'],
        ['ERRO_LIMITE_RATE', true, 'Erro no envio'],
        ['ERRO_PERMANENTE', true, 'Erro no envio'],
        ['NAO_SINCRONIZADO', true, 'Envio pendente'],
        ['PENDENTE', true, 'Envio pendente'],
        ['SINCRONIZANDO', true, 'Envio pendente'],
        ['AGUARDANDO_RETRY', true, 'Envio pendente'],
    ] as const)('status=%s atletaConectado=%s', (status, conectado, textoEsperado) => {
        it(`exibe "${textoEsperado}"`, () => {
            render(<SyncStatusChip statusSincronizacao={status} atletaConectado={conectado} />);
            expect(screen.getByText(textoEsperado)).toBeInTheDocument();
        });
    });

    it('SINCRONIZADO → tooltip "Enviado ao intervals.icu/Garmin"', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado />);
        await userEvent.hover(screen.getByText('No relógio'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Enviado ao intervals.icu/Garmin');
    });

    it('SINCRONIZADO_PARCIAL → tooltip "Enviado ao intervals.icu/Garmin"', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO_PARCIAL" atletaConectado />);
        await userEvent.hover(screen.getByText('No relógio'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Enviado ao intervals.icu/Garmin');
    });

    it.each(['NAO_SINCRONIZADO', 'PENDENTE', 'SINCRONIZANDO', 'AGUARDANDO_RETRY'])(
        '%s → tooltip "Aguardando envio ao relógio"',
        async (status) => {
            render(<SyncStatusChip statusSincronizacao={status} atletaConectado />);
            await userEvent.hover(screen.getByText('Envio pendente'));
            expect(await screen.findByRole('tooltip')).toHaveTextContent('Aguardando envio ao relógio');
        },
    );

    it.each(['ERRO_TEMPORARIO', 'ERRO_AUTENTICACAO', 'ERRO_VALIDACAO', 'ERRO_LIMITE_RATE', 'ERRO_PERMANENTE'])(
        '%s → tooltip com nome legível do status',
        async (status) => {
            render(<SyncStatusChip statusSincronizacao={status} atletaConectado />);
            await userEvent.hover(screen.getByText('Erro no envio'));
            const tooltip = await screen.findByRole('tooltip');
            expect(tooltip.textContent).not.toBe('');
            expect(tooltip.textContent).not.toMatch(/^ERRO_/);
        },
    );

    it('atletaConectado=false vence QUALQUER status (precedência)', () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado={false} />);
        expect(screen.getByText('Não conectado')).toBeInTheDocument();
        expect(screen.queryByText('No relógio')).not.toBeInTheDocument();
    });

    it('atletaConectado=false com status de erro também vence', () => {
        render(<SyncStatusChip statusSincronizacao="ERRO_PERMANENTE" atletaConectado={false} />);
        expect(screen.getByText('Não conectado')).toBeInTheDocument();
    });

    it('atletaConectado=false → tooltip "Atleta não conectou o intervals.icu"', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado={false} />);
        await userEvent.hover(screen.getByText('Não conectado'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Atleta não conectou o intervals.icu');
    });

    it('ambos os props undefined → não renderiza nada (dado antigo)', () => {
        const { container } = render(<SyncStatusChip />);
        expect(container).toBeEmptyDOMElement();
    });
});
