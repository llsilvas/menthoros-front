import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildIntensityLineFromTreino } from './buildIntensityLine';
import { matchZone } from './intensityFormat';
import { aplicarZona, avisosDaEtapa, zonaDaEtapa } from './zoneSelectorLogic';
import { AthleteZonesTable } from '../components/AthleteZonesTable';
import type { AthleteTrainingZonesDto } from '../../../types/AthleteTrainingZones';

/**
 * Payload como o backend o serializa: o `@JsonInclude(NON_NULL)` do record externo não vale para os
 * aninhados, então Z6 chega com `fc: null` e o atleta sem teste chega com datas `null`. Um `!== undefined`
 * derrubava a tela de revisão inteira (`Cannot read properties of null (reading 'min')`).
 */
const PAYLOAD: AthleteTrainingZonesDto = JSON.parse(`{
  "modelo": "LTHR_FRIEL",
  "ancoras": { "paceLimiarMinKm": null, "dataUltimoTestePace": null, "fcLimiar": 153, "dataUltimoTesteFc": null, "fcLimiarEstimada": true },
  "ajusteFadiga": { "segundosPorKm": 0, "tsbProntidao": null },
  "fcMaxima": { "bpm": 180, "estimada": true },
  "disponibilidade": { "pace": false, "fc": true, "motivoPace": "SEM_PACE_LIMIAR" },
  "zonas": [
    { "numero": 2, "nome": "Aeróbico", "pace": null, "fc": { "min": 130, "max": 136 }, "motivoFc": null },
    { "numero": 6, "nome": "Sprint", "pace": null, "fc": null, "motivoFc": "FC_NAO_ESTABILIZA" }
  ]
}`);

describe('zonas com campos null (payload real do backend)', () => {
    it('matchZone não quebra em zona sem FC nem pace', () => {
        expect(() => matchZone({ min: 130, max: 136 }, undefined, PAYLOAD.zonas)).not.toThrow();
        expect(matchZone({ min: 130, max: 136 }, undefined, PAYLOAD.zonas)).toBe('Z2');
        expect(matchZone(undefined, { minSegKm: 300, maxSegKm: 330 }, PAYLOAD.zonas)).toBeNull();
    });

    it('o card monta a linha de intensidade com etapa e zonas null-safe', () => {
        const linha = buildIntensityLineFromTreino(
            [{ tipoEtapa: 'PRINCIPAL', fcAlvoEtapa: '130-136 bpm', ritmoAlvo: '5:15-5:45/km', alvoPrimario: 'FC' }],
            PAYLOAD,
        );

        expect(linha).toMatchObject({ pace: '5:15–5:45', fc: '130–136 bpm', paceIndisponivel: false });
    });

    it('a tabela renderiza sem pace de limiar, sem datas e com Z6 sem FC', () => {
        render(<AthleteZonesTable zones={PAYLOAD} loading={false} error={null} defaultExpanded />);

        expect(screen.getByText(/pace indisponível/i)).toBeInTheDocument();
        expect(screen.getByText(/usar pace/i)).toBeInTheDocument();
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
        expect(screen.queryByText(/limiar de pace/i)).not.toBeInTheDocument();
    });

    it('seletor e avisos toleram as zonas null', () => {
        expect(() => aplicarZona({ zona: null, fcAlvoEtapa: '', ritmoAlvo: '' }, 'Z6', PAYLOAD, 'PRINCIPAL')).not.toThrow();
        expect(() => avisosDaEtapa({ zona: 'Z2', fcAlvoEtapa: '130-136 bpm', ritmoAlvo: '' }, { zones: PAYLOAD, tipoEtapa: 'PRINCIPAL' })).not.toThrow();
        expect(zonaDaEtapa('130-136 bpm', undefined, PAYLOAD)).toBe('Z2');
    });
});
