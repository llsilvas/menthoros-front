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
        // Estados não produzidos pelo fluxo intervals.icu caem no fallback pendente deliberadamente.
        ['DESABILITADO', true, 'Envio pendente'],
        ['CONFLITO', true, 'Envio pendente'],
        ['CANCELADO', true, 'Envio pendente'],
    ] as const)('status=%s atletaConectado=%s', (status, conectado, textoEsperado) => {
        it(`exibe "${textoEsperado}"`, () => {
            render(<SyncStatusChip statusSincronizacao={status} atletaConectado={conectado} />);
            expect(screen.getByText(textoEsperado)).toBeInTheDocument();
        });
    });

    it('SINCRONIZADO → tooltip "Enviado ao relógio"', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado />);
        await userEvent.hover(screen.getByText('No relógio'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Enviado ao relógio');
    });

    it('SINCRONIZADO_PARCIAL → tooltip "Enviado com ajustes" com o motivo do backend', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO_PARCIAL" atletaConectado syncError="Meta de FC descartada" />);
        await userEvent.hover(screen.getByText('No relógio'));
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent('Enviado com ajustes');
        expect(tooltip).toHaveTextContent('Meta de FC descartada');
    });

    it('nenhum texto do chip cita intervals.icu (CA8)', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado />);
        await userEvent.hover(screen.getByText('No relógio'));
        expect((await screen.findByRole('tooltip')).textContent).not.toMatch(/intervals/i);
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
        '%s → tooltip com motivo legível e ação sugerida (CA9)',
        async (status) => {
            render(<SyncStatusChip statusSincronizacao={status} atletaConectado />);
            await userEvent.hover(screen.getByText('Erro no envio'));
            const tooltip = await screen.findByRole('tooltip');
            expect(tooltip.textContent).not.toMatch(/ERRO_/);
            expect(tooltip.textContent).toMatch(/\./);
        },
    );

    it('ERRO_VALIDACAO → tooltip inclui o detalhe do backend', async () => {
        render(<SyncStatusChip statusSincronizacao="ERRO_VALIDACAO" atletaConectado syncError="Etapa sem duração" />);
        await userEvent.hover(screen.getByText('Erro no envio'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Etapa sem duração');
    });

    it('atletaConectado=false vence QUALQUER status (precedência)', () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado={false} />);
        expect(screen.getByText('Não conectado')).toBeInTheDocument();
        expect(screen.queryByText('No relógio')).not.toBeInTheDocument();
    });

    it('atletaConectado=false com status de erro também vence', () => {
        render(<SyncStatusChip statusSincronizacao="ERRO_PERMANENTE" atletaConectado={false} />);
        expect(screen.getByText('Não conectado')).toBeInTheDocument();
    });

    it('atletaConectado=false → tooltip "Atleta sem canal conectado"', async () => {
        render(<SyncStatusChip statusSincronizacao="SINCRONIZADO" atletaConectado={false} />);
        await userEvent.hover(screen.getByText('Não conectado'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Atleta sem canal conectado');
    });

    it('ambos os props undefined → não renderiza nada (dado antigo)', () => {
        const { container } = render(<SyncStatusChip />);
        expect(container).toBeEmptyDOMElement();
    });
});
