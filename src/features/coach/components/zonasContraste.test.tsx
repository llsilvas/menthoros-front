import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AthleteZonesTable } from './AthleteZonesTable';
import { TreinoPlanejadoCard } from './TreinoPlanejadoCard';
import { ZoneSelector } from './etapas/ZoneSelector';
import { fieldSx } from './etapas/etapasStyles';
import { primary, surface, text } from '../../../theme/tokens';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

/**
 * CA17/CA18 (design D9 V1–V3): a verificação automática é do **token resolvido** (jsdom não calcula
 * razão de contraste de forma confiável). A razão 4,5:1 é checagem manual de design review.
 */

const rgb = (hex: string): string => {
    const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const cor = (el: Element): string => getComputedStyle(el).color;

const ZONES: AthleteTrainingZonesDto = {
    modelo: 'LTHR_FRIEL',
    ancoras: { paceLimiarMinKm: 5, dataUltimoTestePace: '2026-09-12', fcLimiar: 168, fcLimiarEstimada: false },
    ajusteFadiga: { segundosPorKm: 0 },
    fcMaxima: { bpm: 185, estimada: false },
    disponibilidade: { pace: true, fc: true },
    zonas: [{ numero: 2, nome: 'Aeróbico', pace: { minSegKm: 315, maxSegKm: 345 }, fc: { min: 143, max: 150 } }],
};

describe('contraste dos textos das zonas (CA17/CA18)', () => {
    it('rótulos do ZoneSelector e dos campos usam text-secondary, nunca text-muted', () => {
        render(
            <ZoneSelector
                idBase="e1"
                zones={ZONES}
                tipoEtapa="PRINCIPAL"
                value={{ zona: 'Z2', fcAlvoEtapa: '143-150 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }}
                onChange={() => undefined}
            />,
        );

        expect(cor(screen.getByText('Relógio:'))).toBe(rgb(text.secondary));
    });

    it('rótulos de campo do editor (fieldSx) são text-secondary — não text-muted', () => {
        // jsdom resolve a cascata sem especificidade e devolve o padrão do MUI; o token é afirmado na fonte.
        const rotulo = fieldSx(primary[500])['& .MuiInputLabel-root'];

        expect(rotulo.color).toBe(surface[400]);
        expect(rotulo.color).not.toBe(text.muted);
    });

    it('texto de aviso é text-primary; só o ícone leva a cor semântica', () => {
        render(
            <ZoneSelector
                idBase="e1"
                zones={ZONES}
                tipoEtapa="PRINCIPAL"
                value={{ zona: 'PERSONALIZADO', fcAlvoEtapa: 'trote leve', ritmoAlvo: '' }}
                onChange={() => undefined}
            />,
        );

        const aviso = screen.getByRole('alert');
        expect(cor(aviso.querySelector('p')!)).toBe(rgb(text.primary));
        expect(cor(aviso.querySelector('svg')!)).not.toBe(rgb(text.primary));
    });

    it('cabeçalhos e rótulos da tabela de zonas usam text-secondary', () => {
        render(<AthleteZonesTable zones={ZONES} loading={false} error={null} defaultExpanded hoje={new Date('2026-10-27T12:00:00')} />);

        for (const cabecalho of ['Zona', 'Pace', 'FC', 'RPE típico', 'Uso típico']) {
            expect(cor(screen.getByRole('columnheader', { name: cabecalho }))).toBe(rgb(text.secondary));
        }
    });

    it('a linha de intensidade do card não usa lime: primário em text-primary, secundário em text-secondary', () => {
        render(
            <TreinoPlanejadoCard
                dia="Ter 20/10"
                tipoTreino="FACIL"
                rotulo="Fácil"
                distanciaKm={10}
                intensidade={{ zona: 'Z2', pace: '5:15–5:45', fc: '143–150 bpm', primario: 'FC', paceIndisponivel: false }}
            />,
        );

        const pace = screen.getByText('5:15–5:45');
        const fc = screen.getByText('143–150 bpm');
        expect(cor(fc)).toBe(rgb(text.primary));
        expect(cor(pace)).toBe(rgb(text.secondary));
        for (const el of [pace, fc]) expect(cor(el)).not.toBe(rgb(primary[500]));
    });
});
