import { describe, expect, it } from 'vitest';
import { buildWatchChannelFromConexao } from './watchChannel';
import type { ConexaoCanalDto } from '../../../types/AtletaPerfilCoach';

function conexao(value: string, ativo: boolean): ConexaoCanalDto {
    return { plataforma: { value, label: value }, ativo, workoutImport: true, activityExport: true };
}

describe('buildWatchChannelFromConexao', () => {
    it('conexão ativa devolve a plataforma', () => {
        expect(buildWatchChannelFromConexao(conexao('GARMIN', true))).toBe('GARMIN');
        expect(buildWatchChannelFromConexao(conexao('INTERVALS_ICU', true))).toBe('INTERVALS_ICU');
    });

    it('revogada, ausente ou plataforma desconhecida: sem canal', () => {
        expect(buildWatchChannelFromConexao(conexao('GARMIN', false))).toBeNull();
        expect(buildWatchChannelFromConexao(null)).toBeNull();
        expect(buildWatchChannelFromConexao(undefined)).toBeNull();
        expect(buildWatchChannelFromConexao(conexao('STRAVA', true))).toBeNull();
    });
});
