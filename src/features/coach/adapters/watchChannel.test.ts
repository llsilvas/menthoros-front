import { describe, expect, it } from 'vitest';
import { buildLockLabelFromRejection, buildWatchChannelFromConexao } from './watchChannel';
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

describe('buildLockLabelFromRejection', () => {
    it('usa o motivo do backend para dia passado e hoje no relógio', () => {
        expect(buildLockLabelFromRejection('PAST_DAY', 'PENDENTE')).toBe('Treino de dia passado — não editável');
        expect(buildLockLabelFromRejection('TODAY_ON_WATCH', 'PENDENTE')).toBe('Treino de hoje já está no relógio');
    });

    it('NOT_PENDING detalha pela execução', () => {
        expect(buildLockLabelFromRejection('NOT_PENDING', 'REALIZADO')).toBe('Treino realizado — não editável');
        expect(buildLockLabelFromRejection('NOT_PENDING', 'PERDIDO')).toBe('Treino perdido — não editável');
    });

    it('motivo ausente ou desconhecido cai num rótulo neutro', () => {
        expect(buildLockLabelFromRejection(undefined, 'PENDENTE')).toBe('Treino não editável');
        expect(buildLockLabelFromRejection('NOVO_MOTIVO', 'PENDENTE')).toBe('Treino não editável');
    });
});
