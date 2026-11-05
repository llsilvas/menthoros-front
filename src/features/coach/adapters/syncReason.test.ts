import { describe, it, expect } from 'vitest';
import { buildSyncReasonFromStatus, isErroSync } from './syncReason';

describe('buildSyncReasonFromStatus', () => {
    it.each([
        ['ERRO_AUTENTICACAO', 'Conexão do canal precisa de autorização', /reautorize/],
        ['ERRO_VALIDACAO', 'O canal recusou o treino', /Ajuste o treino/],
        ['ERRO_LIMITE_RATE', 'Limite de requisições do canal', /tenta de novo/],
        ['ERRO_TEMPORARIO', 'Falha de comunicação com o canal', /tenta de novo/],
        ['ERRO_PERMANENTE', 'Tentativas de envio esgotadas', /Reenvie/],
    ])('%s → motivo e ação sugerida', (status, motivo, acao) => {
        const reason = buildSyncReasonFromStatus(status);

        expect(reason?.motivo).toBe(motivo);
        expect(reason?.acao).toMatch(acao);
    });

    it('anexa a mensagem do backend como detalhe quando presente', () => {
        expect(buildSyncReasonFromStatus('ERRO_VALIDACAO', 'Etapa sem duração')?.detalhe).toBe('Etapa sem duração');
    });

    it('SINCRONIZADO_PARCIAL → enviado com ajustes, com o motivo do backend', () => {
        const reason = buildSyncReasonFromStatus('SINCRONIZADO_PARCIAL', 'Meta de FC descartada');

        expect(reason?.motivo).toBe('Enviado com ajustes');
        expect(reason?.detalhe).toBe('Meta de FC descartada');
    });

    it.each(['SINCRONIZADO', 'AGUARDANDO_RETRY', 'PENDENTE', undefined])('%s → sem motivo', (status) => {
        expect(buildSyncReasonFromStatus(status)).toBeNull();
    });

    it('erro desconhecido cai num motivo genérico', () => {
        expect(buildSyncReasonFromStatus('ERRO_NOVO')?.motivo).toBe('Erro no envio ao relógio');
    });

    it.each([
        ['ERRO_PERMANENTE', true],
        ['ERRO_VALIDACAO', true],
        ['SINCRONIZADO', false],
        [undefined, false],
        [null, false],
    ] as const)('isErroSync(%s) = %s', (status, esperado) => {
        expect(isErroSync(status)).toBe(esperado);
    });
});
