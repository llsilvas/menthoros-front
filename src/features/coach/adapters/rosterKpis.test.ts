import { describe, expect, it } from 'vitest';
import { deriveRosterKpis, buildRosterKpiViews } from './rosterKpis';
import type { RosterKpis } from './rosterKpis';
import type { CoachAtletaResumo } from '../../../types/Coach';

const HOJE = new Date('2026-06-17T12:00:00Z');

function atleta(over: Partial<CoachAtletaResumo>): CoachAtletaResumo {
    return {
        atletaId: '1',
        nome: 'Atleta',
        status: 'active',
        weeklyVolume: 0,
        lastActivity: '2026-06-16',
        hasPendingSuggestion: false,
        ...over,
    };
}

describe('deriveRosterKpis', () => {
    it('conta total, atRisk (warning+danger) e inTaper', () => {
        const kpis = deriveRosterKpis(
            [
                atleta({ status: 'active' }),
                atleta({ status: 'warning' }),
                atleta({ status: 'danger' }),
                atleta({ status: 'paused' }),
                atleta({ status: 'active', fase: 'TAPER' }),
            ],
            HOJE,
        );
        expect(kpis.total).toBe(5);
        expect(kpis.atRisk).toBe(2); // warning + danger; active/paused não contam
        expect(kpis.inTaper).toBe(1);
    });

    it('noActivity7d: limiar exato em 7 dias (BVA)', () => {
        const kpis = deriveRosterKpis(
            [
                atleta({ lastActivity: '2026-06-11' }), // 6 dias → não conta
                atleta({ lastActivity: '2026-06-10' }), // 7 dias → conta
                atleta({ lastActivity: '2026-06-09' }), // 8 dias → conta
                atleta({ lastActivity: undefined }), // sem atividade → conta
            ],
            HOJE,
        );
        expect(kpis.noActivity7d).toBe(3);
    });
});

describe('buildRosterKpiViews', () => {
  const views = (k: Partial<RosterKpis> = {}) =>
    Object.fromEntries(buildRosterKpiViews({ total: 5, atRisk: 4, inTaper: 0, noActivity7d: 3, ...k }).map((v) => [v.key, v]));

  it('quatro células na ordem, com a base de cada número na linha de apoio', () => {
    expect(buildRosterKpiViews({ total: 5, atRisk: 4, inTaper: 0, noActivity7d: 3 }).map((v) => [v.label, v.value, v.detail])).toEqual([
      ['Atletas', '5', '2 com treino nos últimos 7 dias'],
      ['Em risco', '4', 'Status atenção ou alerta'],
      ['Em taper', '0', 'Nenhum atleta na fase de taper'],
      ['Sem atividade', '3', 'Sem treino há 7 dias ou mais'],
    ]);
  });

  it('qualificadores', () => {
    expect(views().noActivity.qualifier).toBe('7 dias');
    expect(views().total.qualifier).toBeNull();
  });

  it('valores neutros: o ícone da célula carrega a cor, não um marcador de estado', () => {
    expect(Object.values(views()).every((v) => v.tone === 'neutral' && v.badge === null)).toBe(true);
  });

  it('textos no singular e sem risco', () => {
    expect(views({ total: 1, noActivity7d: 0 }).total.detail).toBe('1 com treino nos últimos 7 dias');
    expect(views({ atRisk: 0 }).atRisk.detail).toBe('Nenhum atleta em atenção');
    expect(views({ inTaper: 1 }).inTaper.detail).toBe('Na fase de taper antes da prova');
  });
});
