import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchPlanService } from '../../../api/services/BatchPlanService';
import type { BatchPlanJobStatus } from '../../../types/BatchPlanJob';
import {
    PlanGenerationStore,
    MAX_RETRIES,
    POLL_INTERVALO_MS,
    TERMINAL_JANELA_MS,
    TIMEOUT_MS,
} from './planGenerationStore';

vi.mock('../../../api/services/BatchPlanService');

const consultar = vi.mocked(BatchPlanService.consultarStatus);

const statusJob = (over: Partial<BatchPlanJobStatus> = {}): BatchPlanJobStatus => ({
    jobId: 'job-1',
    status: 'EM_PROGRESSO',
    totalAtletas: 1,
    gerados: 0,
    erros: 0,
    geradosDetalhes: [],
    errosDetalhes: [],
    ...over,
});

/** Deixa o microtask do await de `consultarStatus` resolver antes de avançar timers. */
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('PlanGenerationStore', () => {
    let store: PlanGenerationStore;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        store = new PlanGenerationStore();
    });

    afterEach(() => {
        store.dispose();
        vi.useRealTimers();
    });

    it('reserva antes do POST bloqueia redisparo do mesmo atleta (AC9)', () => {
        expect(store.iniciar('a1')).toBe(true);
        expect(store.getEntry('a1')).toMatchObject({ status: 'gerando', jobId: null });
        // segundo clique antes do 202 — bloqueado
        expect(store.iniciar('a1')).toBe(false);
    });

    it('liberar reabre o atleta quando o POST falha', () => {
        store.iniciar('a1');
        store.liberar('a1');
        expect(store.getEntry('a1')).toBeUndefined();
        expect(store.iniciar('a1')).toBe(true);
    });

    it('conclui com sucesso, chama a recarga e limpa a entrada após a janela', async () => {
        const reload = vi.fn();
        store.setOnPlanoGerado(reload);
        consultar.mockResolvedValue(statusJob({ status: 'CONCLUIDO', gerados: 1 }));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();

        expect(store.getEntry('a1')).toMatchObject({ status: 'concluido' });
        expect(reload).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(TERMINAL_JANELA_MS);
        expect(store.getEntry('a1')).toBeUndefined();
    });

    it('marca erro em CONCLUIDO_COM_ERROS com a mensagem de errosDetalhes, sem recarregar', async () => {
        const reload = vi.fn();
        store.setOnPlanoGerado(reload);
        consultar.mockResolvedValue(
            statusJob({ status: 'CONCLUIDO_COM_ERROS', erros: 1, errosDetalhes: [{ atletaId: 'a1', motivo: 'Já existe plano para a semana.' }] }),
        );

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();

        expect(store.getEntry('a1')).toMatchObject({ status: 'erro', mensagem: 'Já existe plano para a semana.' });
        expect(reload).not.toHaveBeenCalled();
    });

    it('fallback agregado: CONCLUIDO_COM_ERROS sem errosDetalhes marca o atleta em erro', async () => {
        // Ramo de segurança do terminal(): o backend deveria mandar errosDetalhes por atleta, mas se
        // vier vazio num terminal com erro, o atleta ainda cai em `erro` (não vira sucesso por omissão).
        consultar.mockResolvedValue(statusJob({ status: 'CONCLUIDO_COM_ERROS', gerados: 0, erros: 1, errosDetalhes: [] }));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();

        expect(store.getEntry('a1')).toMatchObject({ status: 'erro' });
    });

    it('retenta em falha até esgotar e então marca erro (não fica preso em gerando)', async () => {
        consultar.mockRejectedValue(new Error('offline'));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();

        // consulta inicial + MAX_RETRIES retentativas
        for (let i = 0; i < MAX_RETRIES; i++) {
            expect(store.getEntry('a1')).toMatchObject({ status: 'gerando' });
            vi.advanceTimersByTime(POLL_INTERVALO_MS);
            await flush();
        }
        expect(consultar).toHaveBeenCalledTimes(MAX_RETRIES + 1);
        expect(store.getEntry('a1')).toMatchObject({ status: 'erro' });
    });

    it('timeout de segurança marca erro se o job nunca fica terminal', async () => {
        consultar.mockResolvedValue(statusJob({ status: 'EM_PROGRESSO' }));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();

        vi.advanceTimersByTime(TIMEOUT_MS);
        expect(store.getEntry('a1')).toMatchObject({ status: 'erro' });
    });

    it('acompanha dois atletas em paralelo, independentemente (AC6)', async () => {
        consultar.mockImplementation((id: string) =>
            Promise.resolve(statusJob({ jobId: id, status: id === 'job-a' ? 'CONCLUIDO' : 'EM_PROGRESSO', gerados: id === 'job-a' ? 1 : 0 })) as ReturnType<typeof BatchPlanService.consultarStatus>,
        );

        store.iniciar('a1');
        store.anexarJob('a1', 'job-a');
        store.iniciar('a2');
        store.anexarJob('a2', 'job-b');
        await flush();

        expect(store.getEntry('a1')).toMatchObject({ status: 'concluido' });
        expect(store.getEntry('a2')).toMatchObject({ status: 'gerando' });
    });

    it('não inicia um segundo poller para o mesmo jobId (idempotência StrictMode)', async () => {
        consultar.mockResolvedValue(statusJob({ status: 'EM_PROGRESSO' }));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        store.anexarJob('a1', 'job-1'); // remontagem/duplo anexar
        await flush();

        expect(consultar).toHaveBeenCalledTimes(1);
    });

    it('nova geração durante a janela terminal não é apagada pela expiração da anterior (AC8)', async () => {
        consultar.mockResolvedValue(statusJob({ status: 'CONCLUIDO', gerados: 1 }));

        store.iniciar('a1');
        store.anexarJob('a1', 'job-1');
        await flush();
        expect(store.getEntry('a1')).toMatchObject({ status: 'concluido', jobId: 'job-1' });

        // coach dispara de novo ANTES de a janela de 5s expirar
        store.iniciar('a1');
        expect(store.getEntry('a1')).toMatchObject({ status: 'gerando', jobId: null });

        // a expiração da janela do job-1 não pode apagar a nova reserva
        vi.advanceTimersByTime(TERMINAL_JANELA_MS);
        expect(store.getEntry('a1')).toMatchObject({ status: 'gerando' });
    });

    it('lote: um jobId cobre N atletas e o terminal resolve cada um por geradosDetalhes/errosDetalhes', async () => {
        const reload = vi.fn();
        store.setOnPlanoGerado(reload);
        consultar.mockResolvedValue(
            statusJob({
                status: 'CONCLUIDO_COM_ERROS',
                totalAtletas: 3,
                gerados: 2,
                erros: 1,
                geradosDetalhes: [
                    { atletaId: 'a1', planoId: 'p1', atletaNome: 'A' },
                    { atletaId: 'a3', planoId: 'p3', atletaNome: 'C' },
                ],
                errosDetalhes: [{ atletaId: 'a2', motivo: 'Já existe plano para a semana.' }],
            }),
        );

        const reservados = store.iniciarLote(['a1', 'a2', 'a3']);
        expect(reservados).toEqual(['a1', 'a2', 'a3']);
        store.anexarJobLote(reservados, 'job-lote');
        await flush();

        expect(store.getEntry('a1')).toMatchObject({ status: 'concluido' });
        expect(store.getEntry('a3')).toMatchObject({ status: 'concluido' });
        expect(store.getEntry('a2')).toMatchObject({ status: 'erro', mensagem: 'Já existe plano para a semana.' });
        // um único poller para o lote inteiro
        expect(consultar).toHaveBeenCalledTimes(1);
        // houve sucesso no lote → recarrega uma vez
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('lote: getJobStatus expõe o progresso agregado durante o polling', async () => {
        consultar.mockResolvedValue(statusJob({ status: 'EM_PROGRESSO', totalAtletas: 2, gerados: 1, erros: 0 }));

        const reservados = store.iniciarLote(['a1', 'a2']);
        store.anexarJobLote(reservados, 'job-lote');
        await flush();

        expect(store.getJobStatus('job-lote')).toMatchObject({ gerados: 1, totalAtletas: 2 });
        expect(store.getEntry('a1')).toMatchObject({ status: 'gerando' });
        expect(store.getEntry('a2')).toMatchObject({ status: 'gerando' });
    });

    it('iniciarLote pula atletas já em geração', () => {
        store.iniciar('a1');
        const reservados = store.iniciarLote(['a1', 'a2']);
        expect(reservados).toEqual(['a2']); // a1 já estava gerando
    });

    it('notifica assinantes e getEntry mantém referência estável quando nada muda', () => {
        const listener = vi.fn();
        const unsub = store.subscribe(listener);
        store.iniciar('a1');
        expect(listener).toHaveBeenCalled();
        const ref1 = store.getEntry('a1');
        const ref2 = store.getEntry('a1');
        expect(ref1).toBe(ref2); // mesma referência → useSyncExternalStore não re-renderiza
        unsub();
    });
});
