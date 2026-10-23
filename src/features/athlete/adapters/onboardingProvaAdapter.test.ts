import { describe, expect, it } from 'vitest';
import {
    buildOnboardingConclusao,
    faltaNaProvaAlvo,
    inferirTipoProva,
    isProvaAlvoRespondida,
} from './onboardingProvaAdapter';

describe('onboardingProvaAdapter', () => {
    describe('inferirTipoProva', () => {
        it.each([
            ['KM_5', false, 'CORRIDA_RUA'],
            ['KM_10', false, 'CORRIDA_RUA'],
            ['KM_21', false, 'MEIA'],
            ['KM_42', false, 'MARATONA'],
            ['KM_21', true, 'TRAIL'],
            ['KM_5', true, 'TRAIL'],
        ] as const)('%s + trilha=%s → %s', (distancia, trilha, esperado) => {
            expect(inferirTipoProva(distancia, trilha)).toBe(esperado);
        });
    });

    describe('isProvaAlvoRespondida / faltaNaProvaAlvo', () => {
        it('sem resposta: não respondida, falta dizer se tem prova', () => {
            expect(isProvaAlvoRespondida({})).toBe(false);
            expect(faltaNaProvaAlvo({})).toEqual(['dizer se já tem uma prova']);
        });

        it('"ainda não tenho prova" basta', () => {
            expect(isProvaAlvoRespondida({ temProva: false })).toBe(true);
            expect(faltaNaProvaAlvo({ temProva: false })).toEqual([]);
        });

        it('com prova, exige data e distância e nomeia o que falta', () => {
            expect(isProvaAlvoRespondida({ temProva: true })).toBe(false);
            expect(faltaNaProvaAlvo({ temProva: true })).toEqual(['data da prova', 'distância']);
            expect(faltaNaProvaAlvo({ temProva: true, dataProva: '2027-03-14' })).toEqual(['distância']);
            expect(isProvaAlvoRespondida({ temProva: true, dataProva: '2027-03-14', distancia: 'KM_10' })).toBe(true);
        });
    });

    describe('buildOnboardingConclusao', () => {
        it('sem prova → corpo vazio (é o que o backend aceita para concluir sem prova)', () => {
            expect(buildOnboardingConclusao({ temProva: false })).toEqual({});
            expect(buildOnboardingConclusao({})).toEqual({});
        });

        it('com prova, infere o tipo e só manda nome quando preenchido', () => {
            expect(buildOnboardingConclusao({ temProva: true, dataProva: '2027-03-14', distancia: 'KM_21', nomeProva: '  ' }))
                .toEqual({ dataProva: '2027-03-14', distancia: 'KM_21', tipoProva: 'MEIA' });
            expect(buildOnboardingConclusao({ temProva: true, dataProva: '2027-03-14', distancia: 'KM_10', trilha: true, nomeProva: 'Trail da Serra' }))
                .toEqual({ dataProva: '2027-03-14', distancia: 'KM_10', tipoProva: 'TRAIL', nomeProva: 'Trail da Serra' });
        });

        it('prova incompleta nunca vira corpo parcial (o backend rejeitaria)', () => {
            expect(buildOnboardingConclusao({ temProva: true, dataProva: '2027-03-14' })).toEqual({});
        });
    });
});
