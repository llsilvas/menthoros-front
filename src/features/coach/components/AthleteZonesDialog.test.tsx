import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachAthleteZonesService } from '../../../api/services/CoachAthleteZonesService';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';
import { AthleteZonesDialog } from './AthleteZonesDialog';

vi.mock('../../../api/services/CoachAthleteZonesService');

const ZONAS: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { fcLimiar: 168, fcLimiarEstimada: false, dataUltimoTesteFc: '2026-10-12', fonteLimiarFc: 'TESTE_CAMPO' },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 186, estimada: false },
    disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
    zonas: [{ numero: 1, nome: 'Recuperação', fc: { min: 120, max: 140 }, pace: { minSegKm: 400, maxSegKm: 450 } }],
};

function abre(props: Partial<ComponentProps<typeof AthleteZonesDialog>> = {}) {
    const onClose = vi.fn();
    const onSalvo = vi.fn();
    render(
        <AthleteZonesDialog open onClose={onClose} onSalvo={onSalvo} atletaId="a1" nomeAtleta="Maria Souza" zonas={ZONAS} {...props} />,
    );
    return { onClose, onSalvo };
}

describe('AthleteZonesDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(CoachAthleteZonesService.simular).mockResolvedValue(ZONAS);
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockResolvedValue(ZONAS);
    });

    it('fechado não renderiza nada nem simula', () => {
        abre({ open: false });
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(CoachAthleteZonesService.simular).not.toHaveBeenCalled();
    });

    it('abre na aba FC com os valores atuais e o aviso de alcance (CA8)', () => {
        abre();
        expect(screen.getByText('Zonas de Maria')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Zonas de FC', selected: true })).toBeInTheDocument();
        expect(screen.getByLabelText('FC de limiar (bpm)')).toHaveValue('168');
        expect(screen.getByLabelText('FC máxima (bpm)')).toHaveValue('186');
        expect(screen.getByText(/Treinos já criados com alvo em bpm ou ritmo fixo não mudam/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar zonas' })).toBeDisabled();
    });

    it('com FC máxima real mostra a ressalva do envio ao relógio', () => {
        abre();
        expect(screen.getByText(/deixam de ser enviados ao relógio/)).toBeInTheDocument();
    });

    it('FC máxima estimada e campo vazio: sem a ressalva', () => {
        abre({ zonas: { ...ZONAS, fcMaxima: { bpm: 186, estimada: true } } });
        expect(screen.queryByText(/deixam de ser enviados ao relógio/)).toBeNull();
    });

    it('abaInicial pace abre na aba Ritmo (CA10)', () => {
        abre({ abaInicial: 'pace' });
        expect(screen.getByRole('tab', { name: 'Zonas de Ritmo', selected: true })).toBeInTheDocument();
        expect(screen.getByLabelText(/Ritmo de limiar/)).toBeInTheDocument();
    });

    it('ritmo inválido mostra o erro no blur e mantém Salvar desabilitado (CA11)', async () => {
        const user = userEvent.setup();
        abre({ abaInicial: 'pace' });

        await user.type(screen.getByLabelText(/Ritmo de limiar/), '1:00');
        await user.tab();

        expect(await screen.findByText('Ritmo entre 2:30 e 12:00 /km')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar zonas' })).toBeDisabled();
        expect(CoachAthleteZonesService.simular).not.toHaveBeenCalled();
    });

    it('Escape durante o salvamento não fecha o diálogo', async () => {
        const user = userEvent.setup();
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockReturnValue(new Promise(() => undefined) as never);
        const { onClose } = abre({ abaInicial: 'pace' });

        await user.type(screen.getByLabelText(/Ritmo de limiar/), '4:50');
        await user.click(screen.getByRole('button', { name: 'Salvar zonas' }));
        await user.keyboard('{Escape}');

        expect(onClose).not.toHaveBeenCalled();
    });

    it('ritmo válido mostra a prévia e salva: fecha e avisa (CA12)', async () => {
        const user = userEvent.setup();
        const { onClose, onSalvo } = abre({ abaInicial: 'pace' });

        await user.type(screen.getByLabelText(/Ritmo de limiar/), '4:50');

        expect(await screen.findByTestId('previa-zonas')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Salvar zonas' }));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(onSalvo).toHaveBeenCalled();
        expect(vi.mocked(CoachAthleteZonesService.salvarAncoras).mock.calls[0][1].pace?.limiarSegKm).toBe(290);
    });

    it('erro no PUT mantém o diálogo aberto e mostra a mensagem (CA12)', async () => {
        vi.mocked(CoachAthleteZonesService.salvarAncoras).mockRejectedValue(new Error('Falha ao salvar'));
        const user = userEvent.setup();
        const { onClose } = abre({ abaInicial: 'pace' });

        await user.type(screen.getByLabelText(/Ritmo de limiar/), '4:50');
        await user.click(screen.getByRole('button', { name: 'Salvar zonas' }));

        expect(await screen.findByText('Erro ao salvar as zonas')).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByLabelText(/Ritmo de limiar/)).toHaveValue('4:50');
    });
});
