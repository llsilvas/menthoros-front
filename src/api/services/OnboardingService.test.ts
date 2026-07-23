import { describe, expect, it } from 'vitest';
import { normalizeProfile, unwrapEnumValue } from './OnboardingService';
import type { AthleteOnboardingProfile } from '../../types/Onboarding';

describe('unwrapEnumValue', () => {
    it('retorna undefined para null/undefined', () => {
        expect(unwrapEnumValue(null)).toBeUndefined();
        expect(unwrapEnumValue(undefined)).toBeUndefined();
    });

    it('retorna a string diretamente quando já é string', () => {
        expect(unwrapEnumValue('INTERMEDIARIO')).toBe('INTERMEDIARIO');
    });

    it('desembrulha o campo value quando o backend manda o enum como objeto (@JsonFormat OBJECT)', () => {
        const raw = { value: 'INTERMEDIARIO', label: 'Intermediário', description: '...', level: 2 } as unknown as {
            value: 'INTERMEDIARIO';
        };
        expect(unwrapEnumValue(raw)).toBe('INTERMEDIARIO');
    });
});

describe('normalizeProfile', () => {
    it('desembrulha nivelExperiencia e diasDisponiveis quando vem como objeto (round-trip GET -> POST)', () => {
        const perfilComObjetos = {
            id: '1',
            status: 'RASCUNHO',
            preenchidoPorCoach: false,
            criadoEm: '2026-01-01T00:00:00Z',
            atualizadoEm: '2026-01-01T00:00:00Z',
            nivelExperiencia: { value: 'INTERMEDIARIO', label: 'Intermediário' },
            diasDisponiveis: [
                { value: 'SEGUNDA', label: 'Segunda' },
                { value: 'QUARTA', label: 'Quarta' },
            ],
        } as unknown as AthleteOnboardingProfile;

        const normalizado = normalizeProfile(perfilComObjetos);

        expect(normalizado.nivelExperiencia).toBe('INTERMEDIARIO');
        expect(normalizado.diasDisponiveis).toEqual(['SEGUNDA', 'QUARTA']);
    });

    it('mantém string simples intacta quando o backend já manda plain string', () => {
        const perfil: AthleteOnboardingProfile = {
            id: '1',
            status: 'RASCUNHO',
            preenchidoPorCoach: false,
            criadoEm: '2026-01-01T00:00:00Z',
            atualizadoEm: '2026-01-01T00:00:00Z',
            nivelExperiencia: 'AVANCADO',
            diasDisponiveis: ['SEGUNDA'],
        };

        const normalizado = normalizeProfile(perfil);

        expect(normalizado.nivelExperiencia).toBe('AVANCADO');
        expect(normalizado.diasDisponiveis).toEqual(['SEGUNDA']);
    });

    it('mantém diasDisponiveis undefined quando ausente', () => {
        const perfil: AthleteOnboardingProfile = {
            id: '1',
            status: 'RASCUNHO',
            preenchidoPorCoach: false,
            criadoEm: '2026-01-01T00:00:00Z',
            atualizadoEm: '2026-01-01T00:00:00Z',
        };

        expect(normalizeProfile(perfil).diasDisponiveis).toBeUndefined();
    });
});
