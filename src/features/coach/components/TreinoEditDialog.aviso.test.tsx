import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TreinoEditDialog, type TreinoEditDialogProps } from './TreinoEditDialog';
import { useAthleteTrainingZones } from '../../../hooks/useAthleteTrainingZones';
import type { TreinoPlanejadoDto } from '../../../types/PlanoReview';

vi.mock('../../../hooks/useAthleteTrainingZones');

const TREINO: TreinoPlanejadoDto = {
    id: 'treino-1',
    diaSemana: 'QUINTA',
    tipoTreino: 'CONTINUO',
    distanciaKm: 10,
    duracaoMin: 'PT60M',
    percepcaoEsforcoEsperada: 5,
    editadoPeloCoach: false,
    observacao: '',
    etapas: [],
};

const SEMANA = { inicio: '2026-09-07', fim: '2026-09-13' };

describe('TreinoEditDialog — plano já aprovado (coach-editar-treino-aprovado)', () => {
    const onSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAthleteTrainingZones).mockReturnValue({ zones: null, loading: false, error: null, fetchZones: vi.fn() });
    });

    const abrir = (props: Partial<TreinoEditDialogProps> = {}) => render(
        <TreinoEditDialog semana={SEMANA} open treino={TREINO} isSaving={false} atletaNome="Mariana Costa"
            onClose={vi.fn()} onSave={onSave} {...props} />,
    );

    const mudarRpe = () => fireEvent.change(screen.getByLabelText(/esforço esperado/i), { target: { value: '7' } });

    it('sem a prop aviso, fica como hoje: sem caixa de plano aprovado, sem motivo, botão "Salvar"', () => {
        abrir();

        expect(screen.queryByText(/plano já aprovado/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Carga' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('com Garmin: cita o Garmin Connect e o atleta, e o botão vira "Salvar e reenviar" (CA11)', () => {
        abrir({ aviso: { canal: 'GARMIN' } });

        expect(screen.getByText(/este treino faz parte de um plano já aprovado/i)).toBeInTheDocument();
        expect(screen.getByText(/já está no Garmin Connect de Mariana Costa/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
    });

    it('com intervals.icu: cita o intervals.icu', () => {
        abrir({ aviso: { canal: 'INTERVALS_ICU' } });

        expect(screen.getByText(/já está no intervals\.icu de Mariana Costa/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
    });

    it('sem canal: a mudança aparece só no app e o botão é "Salvar" (CA11)', () => {
        abrir({ aviso: { canal: null } });

        expect(screen.getByText(/a mudança aparece só no app/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('neutro (canal desconhecido ou revogado): texto neutro e botão "Salvar", nunca "só no app"', () => {
        abrir({ aviso: { canal: null, neutro: true } });

        expect(screen.getByText(/este treino faz parte de um plano já aprovado/i)).toBeInTheDocument();
        expect(screen.getByText('Se o atleta usa relógio, a versão nova será reenviada.')).toBeInTheDocument();
        expect(screen.queryByText(/só no app/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Carga' })).toBeInTheDocument();
    });

    it('neutro ignora o canal', () => {
        abrir({ aviso: { canal: 'GARMIN', neutro: true } });

        expect(screen.getByText('Se o atleta usa relógio, a versão nova será reenviada.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('motivo é um toque: um selecionado por vez, com aria-pressed, e vai no patch como editReason', () => {
        abrir({ aviso: { canal: 'GARMIN' } });
        const carga = screen.getByRole('button', { name: 'Carga' });
        const dor = screen.getByRole('button', { name: 'Dor/lesão' });

        fireEvent.click(dor);
        fireEvent.click(carga);
        mudarRpe();
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(carga).toHaveAttribute('aria-pressed', 'true');
        expect(dor).toHaveAttribute('aria-pressed', 'false');
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ percepcaoEsforcoEsperada: 7, editReason: 'LOAD' }));
    });

    it('tocar de novo no motivo selecionado desmarca', () => {
        abrir({ aviso: { canal: null } });
        const agenda = screen.getByRole('button', { name: 'Agenda' });

        fireEvent.click(agenda);
        fireEvent.click(agenda);
        mudarRpe();
        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(agenda).toHaveAttribute('aria-pressed', 'false');
        expect(onSave.mock.calls[0][0]).not.toHaveProperty('editReason');
    });

    it('só o motivo, sem mudança no treino, não salva', () => {
        const onClose = vi.fn();
        abrir({ aviso: { canal: 'GARMIN' }, onClose });

        fireEvent.click(screen.getByRole('button', { name: 'Outro' }));
        fireEvent.click(screen.getByRole('button', { name: 'Salvar e reenviar' }));

        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('erro do backend (409/422) aparece numa faixa de alerta sem fechar o dialog (D5)', () => {
        abrir({ aviso: { canal: 'GARMIN' }, saveErrorMessage: 'Envio ao relógio em andamento; tente em alguns segundos.' });

        expect(screen.getByRole('alert')).toHaveTextContent('Envio ao relógio em andamento');
        expect(screen.getByRole('button', { name: 'Salvar e reenviar' })).toBeInTheDocument();
    });
});
