import { BatchPlanService } from '../../../api/services/BatchPlanService';
import { isBatchJobTerminal, type BatchPlanJobStatus } from '../../../types/BatchPlanJob';

/**
 * Store da geração de plano no nível do coach — vive fora dos dialogs para que a linha do roster
 * reflita o estado mesmo com o dialog fechado (change plano-em-geracao-no-roster).
 *
 * Centrado em `jobId`: um job pode cobrir 1 (gerar-de-um) ou N atletas (gerar em lote). Há UM poller
 * por `jobId` sobre `BatchPlanService.consultarStatus`; no terminal, cada atleta é resolvido pelos
 * `geradosDetalhes`/`errosDetalhes` do job. As linhas leem por `atletaId` (assinatura seletiva) e os
 * dialogs leem o agregado do job por `jobId` — fonte única de verdade, um só polling.
 *
 * Decisão de arquitetura (DoR): NÃO reusa `useBatchPlanGeneration` — aquele hook é estado singleton
 * por instância. Sem persistência: recarregar a página ou sair da área do coach descarta o estado
 * (o job segue no servidor). Limitação aceita da change.
 */

export type PlanGenerationStatus = 'gerando' | 'concluido' | 'erro';

export interface PlanGenerationEntry {
    readonly atletaId: string;
    /** null enquanto a reserva (antes do POST) ainda não recebeu o jobId do 202. */
    readonly jobId: string | null;
    readonly status: PlanGenerationStatus;
    readonly mensagem?: string;
    /** Instante do terminal — a entrada é limpa após TERMINAL_JANELA_MS. */
    readonly terminalEm?: number;
}

export const POLL_INTERVALO_MS = 3000;
export const TERMINAL_JANELA_MS = 5000;
/** Uma consulta inicial + até MAX_RETRIES retentativas antes de desistir. */
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 5 * 60_000;

const ERRO_CONSULTA = 'Falha ao consultar o progresso da geração.';
const ERRO_FALLBACK = 'Não foi possível gerar o plano. Tente novamente.';
const TIMEOUT_MSG = 'A geração está demorando mais que o esperado — verifique novamente em instantes.';

interface Poller {
    cancelled: boolean;
    retries: number;
    next: ReturnType<typeof setTimeout> | null;
    safety: ReturnType<typeof setTimeout> | null;
}

interface Job {
    atletaIds: string[];
    /** Último status do polling — alimenta o progresso agregado lido pelos dialogs. */
    status: BatchPlanJobStatus | null;
    poller: Poller;
}

/** Leitura reativa consumida pelo `useSyncExternalStore`. */
export interface PlanGenerationReadable {
    getEntry(atletaId: string): PlanGenerationEntry | undefined;
    getJobStatus(jobId: string): BatchPlanJobStatus | null;
    subscribe(listener: () => void): () => void;
}

export class PlanGenerationStore implements PlanGenerationReadable {
    private entries = new Map<string, PlanGenerationEntry>(); // por atletaId (linha do roster)
    private jobs = new Map<string, Job>(); // por jobId (poller + agregado)
    private janelas = new Map<string, ReturnType<typeof setTimeout>>(); // limpeza terminal por atletaId
    private listeners = new Set<() => void>();

    /** Marca este store como o provider real (o `nullStore` do contexto usa `false`). */
    readonly hasProvider = true;

    // Single-slot proposital: só o ÚLTIMO callback registrado é chamado — não é um barramento de
    // eventos. Hoje só o CoachAthletesPage registra (fetchRoster + reviewFetchPendentes). Se um dia
    // dois consumidores precisarem reagir ao terminal, trocar por um Set<() => void>.
    private onPlanoGerado?: () => void;

    setOnPlanoGerado = (cb?: () => void): void => {
        this.onPlanoGerado = cb;
    };

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getEntry = (atletaId: string): PlanGenerationEntry | undefined => this.entries.get(atletaId);

    getJobStatus = (jobId: string): BatchPlanJobStatus | null => this.jobs.get(jobId)?.status ?? null;

    private emit(): void {
        this.listeners.forEach((l) => l());
    }

    private set(atletaId: string, entry: PlanGenerationEntry): void {
        this.entries.set(atletaId, entry);
        this.emit();
    }

    private remove(atletaId: string): void {
        if (this.entries.delete(atletaId)) this.emit();
    }

    /**
     * Reserva ANTES do POST (lote de 1). Bloqueia redisparo do mesmo atleta. Retorna false se já há
     * geração em andamento para o atleta.
     */
    iniciar = (atletaId: string): boolean => this.iniciarLote([atletaId]).length > 0;

    /**
     * Reserva ANTES do POST para vários atletas. Pula os que já estão gerando; devolve os IDs
     * efetivamente reservados (os que o `anexarJobLote` deve associar ao jobId).
     */
    iniciarLote = (atletaIds: string[]): string[] => {
        const reservados: string[] = [];
        for (const id of atletaIds) {
            const cur = this.entries.get(id);
            if (cur && cur.status === 'gerando') continue;
            this.limparJanela(id);
            this.set(id, { atletaId: id, jobId: null, status: 'gerando' });
            reservados.push(id);
        }
        return reservados;
    };

    /** Anexa o jobId do 202 (lote de 1) e inicia o poller. */
    anexarJob = (atletaId: string, jobId: string): void => this.anexarJobLote([atletaId], jobId);

    /** Anexa o jobId do 202 a vários atletas e inicia UM poller para o job. */
    anexarJobLote = (atletaIds: string[], jobId: string): void => {
        const alvo = atletaIds.filter((id) => {
            const c = this.entries.get(id);
            return c && c.status === 'gerando';
        });
        if (alvo.length === 0) return;
        alvo.forEach((id) => this.set(id, { ...this.entries.get(id)!, jobId }));
        this.startPoller(jobId, alvo);
    };

    /** Libera a reserva quando o POST falha (só as ainda pendentes, sem jobId). */
    liberar = (atletaId: string): void => {
        const cur = this.entries.get(atletaId);
        if (!cur || cur.status !== 'gerando' || cur.jobId !== null) return;
        this.remove(atletaId);
    };

    liberarLote = (atletaIds: string[]): void => atletaIds.forEach((id) => this.liberar(id));

    private startPoller(jobId: string, atletaIds: string[]): void {
        if (this.jobs.has(jobId)) return; // idempotente — não inicia 2º poller pro mesmo jobId
        const poller: Poller = { cancelled: false, retries: 0, next: null, safety: null };
        this.jobs.set(jobId, { atletaIds, status: null, poller });
        poller.safety = setTimeout(() => this.falharJob(jobId, TIMEOUT_MSG), TIMEOUT_MS);
        void this.consultar(jobId);
    }

    private async consultar(jobId: string): Promise<void> {
        const job = this.jobs.get(jobId);
        if (!job || job.poller.cancelled) return;
        try {
            const atual = await BatchPlanService.consultarStatus(jobId);
            const j = this.jobs.get(jobId);
            if (!j || j.poller.cancelled) return;
            j.poller.retries = 0;
            j.status = atual;
            this.emit(); // agregado atualizado (progresso dos dialogs)
            if (isBatchJobTerminal(atual.status)) {
                this.terminal(jobId, atual);
                return;
            }
            j.poller.next = setTimeout(() => void this.consultar(jobId), POLL_INTERVALO_MS);
        } catch {
            const j = this.jobs.get(jobId);
            if (!j || j.poller.cancelled) return;
            j.poller.retries += 1;
            if (j.poller.retries > MAX_RETRIES) {
                this.falharJob(jobId, ERRO_CONSULTA);
                return;
            }
            j.poller.next = setTimeout(() => void this.consultar(jobId), POLL_INTERVALO_MS);
        }
    }

    private terminal(jobId: string, st: BatchPlanJobStatus): void {
        const job = this.jobs.get(jobId);
        if (!job) return;
        this.stopPoller(jobId);
        const gerados = new Set(st.geradosDetalhes.map((g) => g.atletaId));
        const erros = new Map(st.errosDetalhes.map((e) => [e.atletaId, e.motivo] as const));
        // Fallback para lote de 1 sem detalhes por atleta: usa o agregado do job.
        const comErroAgregado = st.status === 'CONCLUIDO_COM_ERROS' || st.erros > 0 || st.gerados === 0;
        let algumSucesso = false;

        job.atletaIds.forEach((id) => {
            const cur = this.entries.get(id);
            if (!cur || cur.jobId !== jobId) return; // um job sucessor assumiu este atleta — ignora
            if (gerados.has(id)) {
                this.set(id, { ...cur, status: 'concluido', terminalEm: Date.now() });
                algumSucesso = true;
            } else if (erros.has(id)) {
                this.set(id, { ...cur, status: 'erro', mensagem: erros.get(id) ?? ERRO_FALLBACK, terminalEm: Date.now() });
            } else if (comErroAgregado) {
                this.set(id, { ...cur, status: 'erro', mensagem: st.errosDetalhes[0]?.motivo ?? ERRO_FALLBACK, terminalEm: Date.now() });
            } else {
                this.set(id, { ...cur, status: 'concluido', terminalEm: Date.now() });
                algumSucesso = true;
            }
            this.agendarLimpeza(id, jobId);
        });

        if (algumSucesso) this.onPlanoGerado?.();
    }

    /** Falha o job inteiro (esgotou retentativas de rede ou timeout): marca todos os atletas em erro. */
    private falharJob(jobId: string, msg: string): void {
        const job = this.jobs.get(jobId);
        if (!job) return;
        this.stopPoller(jobId);
        job.atletaIds.forEach((id) => {
            const cur = this.entries.get(id);
            if (!cur || cur.jobId !== jobId) return;
            this.set(id, { ...cur, status: 'erro', mensagem: msg, terminalEm: Date.now() });
            this.agendarLimpeza(id, jobId);
        });
    }

    /** Agenda a limpeza da entrada terminal; não apaga se um job sucessor já assumiu o atleta. */
    private agendarLimpeza(atletaId: string, jobId: string): void {
        this.limparJanela(atletaId);
        const t = setTimeout(() => {
            this.janelas.delete(atletaId);
            const cur = this.entries.get(atletaId);
            if (cur && cur.jobId === jobId) this.remove(atletaId);
        }, TERMINAL_JANELA_MS);
        this.janelas.set(atletaId, t);
    }

    private limparJanela(atletaId: string): void {
        const t = this.janelas.get(atletaId);
        if (t) {
            clearTimeout(t);
            this.janelas.delete(atletaId);
        }
    }

    /** Para o poller do job (mantém a entrada `jobs` com o status final para o agregado dos dialogs). */
    private stopPoller(jobId: string): void {
        const job = this.jobs.get(jobId);
        if (!job) return;
        job.poller.cancelled = true;
        if (job.poller.next) clearTimeout(job.poller.next);
        if (job.poller.safety) clearTimeout(job.poller.safety);
    }

    /** Cancela todos os pollers/timers e zera o estado — chamado no unmount do Provider. */
    dispose = (): void => {
        this.jobs.forEach((job) => {
            job.poller.cancelled = true;
            if (job.poller.next) clearTimeout(job.poller.next);
            if (job.poller.safety) clearTimeout(job.poller.safety);
        });
        this.jobs.clear();
        this.janelas.forEach((t) => clearTimeout(t));
        this.janelas.clear();
        this.entries.clear();
        this.listeners.clear();
    };
}
