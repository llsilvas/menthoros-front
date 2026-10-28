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
        expect(screen.getByTestId('pilula-pace')).toHaveTextContent('4:30–4:45 /km');
        expect(screen.getByTestId('pilula-fc')).toHaveTextContent('168–178 bpm');
        expect(u.get().alvoPrimario).toBe('PACE');
    });

    it('escolher Z2 numa etapa PRINCIPAL pré-seleciona FC', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        expect(u.get()).toMatchObject({ zona: 'Z2', alvoPrimario: 'FC', ritmoAlvo: '5:15-5:45/km', fcAlvoEtapa: '143-150 bpm' });
    });

    it('o toggle "Relógio alerta por:" tem rótulo visível e troca o eixo num clique', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        expect(screen.getByText('Relógio alerta por:')).toBeVisible();
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

    it('zona escolhida mostra os valores como pills; ajustar exige Personalizado, que mantém os valores', async () => {
        const u = ultimo();
        render(<Harness onValor={u.set} />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));
        expect(screen.queryByRole('textbox', { name: /pace alvo/i })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('radio', { name: /personalizado/i }));

        expect(screen.getByRole('textbox', { name: /pace alvo/i })).toHaveValue('5:15-5:45/km');
        expect(screen.getByRole('textbox', { name: /fc alvo \(bpm\)/i })).toHaveValue('143-150 bpm');
        expect(u.get().zona).toBe('PERSONALIZADO');
    });

    it('editar o pace à mão mantém a zona Personalizada e a FC', async () => {
        const u = ultimo();
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }} onValor={u.set} />);

        await userEvent.type(screen.getByRole('textbox', { name: /pace alvo/i }), '0');

        expect(u.get().zona).toBe('PERSONALIZADO');
        expect(u.get().fcAlvoEtapa).toBe('143-150 bpm');
    });

    it('ao sair do campo, completa a unidade que o parser do backend exige', async () => {
        const u = ultimo();
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '', ritmoAlvo: '', alvoPrimario: 'NENHUM' }} onValor={u.set} />);

        await userEvent.type(screen.getByRole('textbox', { name: /fc alvo/i }), '143-150');
        await userEvent.tab();

        expect(u.get().fcAlvoEtapa).toBe('143-150 bpm');
    });

    it('com um eixo só, diz qual é o único em vez de mostrar o toggle', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '', ritmoAlvo: '5:00-5:15/km', alvoPrimario: 'PACE' }} />);

        expect(screen.getByTestId('eixo-unico')).toHaveTextContent('Pace · único eixo');
        expect(screen.queryByRole('radio', { name: 'FC' })).not.toBeInTheDocument();
    });

    it('sem pace de limiar o Z6 fica desabilitado e a zona escolhida grava só a FC', async () => {
        const semPace: AthleteTrainingZonesDto = {
            ...ZONES,
            disponibilidade: { pace: false, fc: true, motivoPace: 'SEM_PACE_LIMIAR' },
            zonas: ZONES.zonas.map((z) => ({ ...z, pace: undefined })),
        };
        const u = ultimo();
        render(<Harness zones={semPace} onValor={u.set} />);

        expect(screen.getByRole('radio', { name: 'Z6' })).toBeDisabled();
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));

        expect(u.get()).toMatchObject({ ritmoAlvo: '', fcAlvoEtapa: '143-150 bpm', alvoPrimario: 'FC' });
        expect(screen.getByTestId('pilula-pace')).toHaveTextContent('pace indisponível');
        expect(screen.getByTestId('eixo-unico')).toHaveTextContent('FC · único eixo');
        expect(screen.getByText(/sem pace de limiar: a zona grava só a fc/i)).toBeInTheDocument();
    });

    it('Z6 mostra "sem FC", Pace como único eixo e explica por quê', async () => {
        render(<Harness />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z6' }));

        expect(screen.getByTestId('pilula-fc')).toHaveTextContent('sem FC');
        expect(screen.getByTestId('eixo-unico')).toHaveTextContent('Pace · único eixo');
        expect(screen.getByText(/z6 não tem alvo de fc: a fc não estabiliza/i)).toBeInTheDocument();
    });

    it('dica do eixo: pré-preenchido, depois "sua escolha" quando o treinador troca', async () => {
        render(<Harness />);
        await userEvent.click(screen.getByRole('radio', { name: 'Z2' }));
        expect(screen.getByText(/pré-preenchido · troque o eixo se preferir/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('radio', { name: 'Pace' }));

        expect(screen.getByText(/sua escolha · mantida ao trocar de zona/i)).toBeInTheDocument();
    });

    it('etapa de tiro pré-seleciona pace e a dica explica a FC lenta', async () => {
        render(<Harness tipoEtapa="INTERVALADO" />);

        await userEvent.click(screen.getByRole('radio', { name: 'Z5' }));

        expect(screen.getByText(/a fc leva ~2 min para estabilizar/i)).toBeInTheDocument();
    });

    it('sem objetivo é uma escolha explícita, dita com as palavras do Garmin', () => {
        render(<Harness inicial={{ zona: null, fcAlvoEtapa: '', ritmoAlvo: '', alvoPrimario: 'NENHUM' }} />);

        expect(screen.getByText(/etapa livre, sem meta de intensidade/i)).toBeInTheDocument();
    });

    it('sem zonas carregadas mostra só os campos de valor, sem seletor de zona', () => {
        render(<Harness zones={null} />);

        expect(screen.queryByRole('radiogroup', { name: /zona da etapa/i })).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /pace alvo/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /^FC alvo/ })).toBeInTheDocument();
    });

    it('texto legado aparece como Personalizado, com aviso, e não é apagado', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: 'trote leve', ritmoAlvo: '' }} />);

        expect(screen.getByRole('textbox', { name: /^FC alvo/ })).toHaveValue('trote leve');
        expect(screen.getByText(/trote leve.*não vira alvo no relógio/i).closest('[role="alert"]')).not.toBeNull();
    });

    it('avisos são role=alert e o campo os referencia por aria-describedby', () => {
        render(<Harness inicial={{ zona: 'PERSONALIZADO', fcAlvoEtapa: '168-190 bpm', ritmoAlvo: '', alvoPrimario: 'FC' }} />);

        const alerta = screen.getByText(/passa da máxima/i).closest('[role="alert"]') as HTMLElement;
        expect(alerta).not.toBeNull();
        expect(screen.getByRole('textbox', { name: /^FC alvo/ }).getAttribute('aria-describedby')).toContain(alerta.id);
    });

    it('os alvos de toque têm ao menos 40 px (zona) e 44 px (toggle)', () => {
        render(<Harness inicial={{ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }} />);

        expect(screen.getByRole('radio', { name: 'Z2' })).toHaveStyle({ minHeight: '40px' });
        expect(screen.getByRole('radio', { name: 'Pace' })).toHaveStyle({ minHeight: '44px' });
    });
});
