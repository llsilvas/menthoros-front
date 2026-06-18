import { describe, expect, it } from 'vitest';
import { deriveRosterKpis } from './rosterKpis';
import type { CoachAtletaResumo } from '../../../types/Coach';

const HOJE = new Date('2026-06-17T12:00:00Z');

function atleta(over: Partial<CoachAtletaResumo>): CoachAtletaResumo {
    return {
        atletaId: '1',
        nome: 'Atleta',
        status: 'active',
        weeklyVolume: 0,
        lastActivity: '2026-06-16',
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
