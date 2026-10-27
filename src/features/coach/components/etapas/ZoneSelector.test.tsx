import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ZoneSelector } from './ZoneSelector';
import type { IntensidadeEtapa } from '../../adapters/zoneSelectorLogic';
import type { AthleteTrainingZonesDto } from '../../../../types/AthleteTrainingZones';

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [
        { numero: 1, nome: 'Recuperação', pace: { minSegKm: 345, maxSegKm: 375 }, fc: { min: 126, max: 143 } },
        { numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } },
        { numero: 3, nome: 'Tempo', pace: { minSegKm: 300, maxSegKm: 315 }, fc: { min: 150, max: 158 } },
        { numero: 4, nome: 'Limiar', pace: { minSegKm: 285, maxSegKm: 300 }, fc: { min: 158, max: 168 } },
        { numero: 5, nome: 'VO2max', pace: { minSegKm: 270, maxSegKm: 285 }, fc: { min: 168, max: 178 } },
        { numero: 6, nome: 'Sprint', pace: { minSegKm: 246, maxSegKm: 270 }, motivoFc: 'FC_NAO_ESTABILIZA' },
    ],
};

const VAZIA: IntensidadeEtapa = { zona: null, fcAlvoEtapa: '', ritmoAlvo: '' };

function Harness({
    inicial = VAZIA,
    zones = ZONES,
    tipoEtapa = 'PRINCIPAL',
    onValor,
}: {
    inicial?: IntensidadeEtapa;
    zones?: AthleteTrainingZonesDto | null;
    tipoEtapa?: string;
    onValor?: (v: IntensidadeEtapa) => void;
}) {
    const [valor, setValor] = useState(inicial);
    return (
        <ZoneSelector
            value={valor}
            zones={zones}
            tipoEtapa={tipoEtapa}
            idBase="e1"
            onChange={(v) => {
                setValor(v);
                onValor?.(v);
            }}
        />
    );
}

const ultimo = () => {
    let v: IntensidadeEtapa | undefined;
    return { set: (x: IntensidadeEtapa) => { v = x; }, get: () => v! };
};

describe('ZoneSelector', () => {
    it('mostra Z1–Z6 e Personalizado como radiogroup acessível', () => {
        render(<Harness />);

        const grupo = screen.getByRole('radiogroup', { name: /zona da etapa/i });
        expect(within(grupo).getAllByRole('radio')).toHaveLength(7);
        expect(within(grupo).getByRole('radio', { name: /personalizado/i })).toBeInTheDocument();
    });

    it('escolher Z5 preenche os valores iguais aos da tabela do atleta e marca a zona', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} tipoEtapa="INTERVALADO" />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z5' }));

        expect(screen.getByRole('radio', { name: 'Z5' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('textbox', { name: /ritmo/i })).toHaveValue('4:30-4:45/km');
        expect(screen.getByRole('textbox', { name: /^FC/ })).toHaveValue('168-178 bpm');
        expect(u.get().alvoPrimario).toBe('PACE');
    });

    it('escolher Z2 numa etapa PRINCIPAL pré-seleciona FC', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        expect(u.get()).toMatchObject({ zona: 'Z2', alvoPrimario: 'FC', ritmoAlvo: '5:15-5:45/km', fcAlvoEtapa: '143-150 bpm' });
    });

    it('o toggle "Relógio:" tem rótulo visível e troca o eixo num clique', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        expect(screen.getByText('Relógio:')).toBeVisible();
        await userEvent.click(screen.getByRole('radio', { name: 'Pace' }));

        expect(u.get().alvoPrimario).toBe('PACE');
        expect(screen.getByRole('radio', { name: 'Pace' })).toHaveAttribute('aria-checked', 'true');
    });

    it('eixo trocado pelo treinador não volta ao default ao mudar a zona', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));
        await userEvent.click(screen.getByRole('radio', { name: 'Pace' }));

        await userEvent.click(screen.getByRole('radio', { name: 'Z3' }));

        expect(u.get()).toMatchObject({ zona: 'Z3', alvoPrimario: 'PACE' });
    });

    it('editar o ritmo à mão vira Personalizado e mantém a FC', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        await userEvent.type(screen.getByRole('textbox', { name: /ritmo/i }), '0');

        expect(u.get().zona).toBe('PERSONALIZADO');
        expect(u.get().fcAlvoEtapa).toBe('143-150 bpm');
        expect(screen.getByRole('radio', { name: /personalizado/i })).toHaveAttribute('aria-checked', 'true');
    });

    it('toggle só habilita o eixo com valor; com um eixo só, explica', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '', ritmoAlvo: '5:00-5:15/km', alvoPrimario: 'PACE' }} />);

        expect(screen.getByRole('radio', { name: 'FC' })).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'Pace' })).toBeEnabled();
    });

    it('Z6 sem pace de limiar não preenche nada e explica', async () => {
        const semPace: AthleteTrainingZonesDto = {
            ...ZONES,
            disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
            zonas: ZONES.zonas.map((z) => ({ ...z, pace: undefined })),
        };
        const u = ultimo();
        render(<Harness zones={semPace} onValor={u.set} />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z6' }));

        expect(u.get()).toMatchObject({ ritmoAlvo: '', fcAlvoEtapa: '', alvoPrimario: 'NENHUM' });
        expect(screen.getByText(/z6 precisa do pace de limiar/i)).toBeInTheDocument();
    });

    it('sem zonas carregadas mostra só os campos de valor, sem seletor de zona', () => {
        render(<Harness zones={null} />);

        expect(screen.queryByRole('radiogroup', { name: /zona da etapa/i })).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /ritmo/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /^FC/ })).toBeInTheDocument();
    });

    it('texto legado aparece como Personalizado, com aviso, e não é apagado', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: 'trote leve', ritmoAlvo: '' }} />);

        expect(screen.getByRole('textbox', { name: /^FC/ })).toHaveValue('trote leve');
        expect(screen.getByText(/trote leve.*não vira alvo no relógio/i).closest('[role="alert"]')).not.toBeNull();
    });

    it('avisos são role=alert e o campo os referencia por aria-describedby', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '168-190 bpm', ritmoAlvo: '', alvoPrimario: 'FC' }} />);

        const alerta = screen.getByText(/passa da máxima/i).closest('[role="alert"]') as HTMLElement;
        expect(alerta).not.toBeNull();
        expect(screen.getByRole('textbox', { name: /^FC/ }).getAttribute('aria-describedby')).toContain(alerta.id);
    });

    it('os alvos de toque têm ao menos 40 px (zona) e 44 px (toggle)', () => {
        render(<Harness inicial={{ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }} />);

        expect(screen.getByRole('radio', { name: 'Z2' })).toHaveStyle({ minHeight: '40px' });
        expect(screen.getByRole('radio', { name: 'Pace' })).toHaveStyle({ minHeight: '44px' });
    });
});
