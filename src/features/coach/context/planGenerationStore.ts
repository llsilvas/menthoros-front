import { BatchPlanService } from '../../../api/services/BatchPlanService';
import { isBatchJobTerminal, type BatchPlanJobStatus } from '../../../types/BatchPlanJob';

/**
 * Store da geração de plano no nível do coach — vive fora do PlanosDialog para que a linha do
 * roster reflita o estado mesmo com o dialog fechado (change plano-em-geracao-no-roster).
 *
 * Decisão de arquitetura (DoR): NÃO reusa `useBatchPlanGeneration` — aquele hook é estado singleton
 * por instância e não acompanha múltiplos jobs. Aqui há um poller próprio por `jobId` sobre
 * `BatchPlanService.consultarStatus`, um mapa por `atletaId`, e assinatura seletiva (o Provider expõe
 * `getEntry`/`subscribe` a `useSyncExternalStore`, de forma que só as linhas em geração re-renderizem).
 *
 * Sem persistência: recarregar a página ou sair da área do coach descarta o estado (o job segue no
 * servidor). É limitação aceita da change.
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

/** Leitura reativa consumida pelo `useSyncExternalStore`. */
export interface PlanGenerationReadable {
    getEntry(atletaId: string): PlanGenerationEntry | undefined;
    subscribe(listener: () => void): () => void;
}

export class PlanGenerationStore implements PlanGenerationReadable {
    private entries = new Map<string, PlanGenerationEntry>();
    private listeners = new Set<() => void>();
    private pollers = new Map<string, Poller>(); // por jobId — garante idempotência (StrictMode)
    private janelas = new Map<string, ReturnType<typeof setTimeout>>(); // limpeza terminal por atletaId
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
     * Reserva ANTES do POST. Bloqueia redisparo do mesmo atleta (dois cliques rápidos → um único
     * gerar-lote). Retorna false se já há geração em andamento para o atleta.
     */
    iniciar = (atletaId: string): boolean => {
        const cur = this.entries.get(atletaId);
        if (cur && cur.status === 'gerando') return false;
        this.limparJanela(atletaId);
        this.set(atletaId, { atletaId, jobId: null, status: 'gerando' });
        return true;
    };

    /** Anexa o jobId do 202 e inicia o poller. Ainda funciona se o dialog já foi fechado. */
    anexarJob = (atletaId: string, jobId: string): void => {
        const cur = this.entries.get(atletaId);
        if (!cur || cur.status !== 'gerando') return; // reserva liberada/sumiu
        this.set(atletaId, { ...cur, jobId });
        this.startPoller(atletaId, jobId);
    };

    /** Libera a reserva quando o POST falha (só se ainda pendente, sem jobId). */
    liberar = (atletaId: string): void => {
        const cur = this.entries.get(atletaId);
        if (!cur || cur.status !== 'gerando' || cur.jobId !== null) return;
        this.remove(atletaId);
    };

    private startPoller(atletaId: string, jobId: string): void {
        if (this.pollers.has(jobId)) return; // idempotente — não inicia 2º poller pro mesmo jobId
        const poller: Poller = { cancelled: false, retries: 0, next: null, safety: null };
        this.pollers.set(jobId, poller);
        poller.safety = setTimeout(() => this.falhaTerminal(atletaId, jobId, TIMEOUT_MSG), TIMEOUT_MS);
        void this.consultar(atletaId, jobId, poller);
    }

    private async consultar(atletaId: string, jobId: string, poller: Poller): Promise<void> {
        try {
            const atual = await BatchPlanService.consultarStatus(jobId);
            if (poller.cancelled) return;
            poller.retries = 0;
            if (isBatchJobTerminal(atual.status)) {
                this.terminal(atletaId, jobId, atual);
                return;
            }
            poller.next = setTimeout(() => void this.consultar(atletaId, jobId, poller), POLL_INTERVALO_MS);
        } catch {
            if (poller.cancelled) return;
            poller.retries += 1;
            if (poller.retries > MAX_RETRIES) {
                this.falhaTerminal(atletaId, jobId, ERRO_CONSULTA);
                return;
            }
            poller.next = setTimeout(() => void this.consultar(atletaId, jobId, poller), POLL_INTERVALO_MS);
        }
    }

    private terminal(atletaId: string, jobId: string, st: BatchPlanJobStatus): void {
        this.stopPoller(jobId);
        const cur = this.entries.get(atletaId);
        if (!cur || cur.jobId !== jobId) return; // um job sucessor assumiu — ignora este terminal
        const comErro = st.status === 'CONCLUIDO_COM_ERROS' || st.erros > 0 || st.gerados === 0;
        if (comErro) {
            const motivo = st.errosDetalhes[0]?.motivo ?? ERRO_FALLBACK;
            this.set(atletaId, { ...cur, status: 'erro', mensagem: motivo, terminalEm: Date.now() });
        } else {
            this.set(atletaId, { ...cur, status: 'concluido', terminalEm: Date.now() });
            this.onPlanoGerado?.();
        }
        this.agendarLimpeza(atletaId, jobId);
    }

    private falhaTerminal(atletaId: string, jobId: string, msg: string): void {
        this.stopPoller(jobId);
        const cur = this.entries.get(atletaId);
        if (!cur || cur.jobId !== jobId) return;
        this.set(atletaId, { ...cur, status: 'erro', mensagem: msg, terminalEm: Date.now() });
        this.agendarLimpeza(atletaId, jobId);
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

    private stopPoller(jobId: string): void {
        const p = this.pollers.get(jobId);
        if (!p) return;
        p.cancelled = true;
        if (p.next) clearTimeout(p.next);
        if (p.safety) clearTimeout(p.safety);
        this.pollers.delete(jobId);
    }

    /** Cancela todos os pollers/timers e zera o estado — chamado no unmount do Provider. */
    dispose = (): void => {
        this.pollers.forEach((p) => {
            p.cancelled = true;
            if (p.next) clearTimeout(p.next);
            if (p.safety) clearTimeout(p.safety);
        });
        this.pollers.clear();
        this.janelas.forEach((t) => clearTimeout(t));
        this.janelas.clear();
        this.entries.clear();
        this.listeners.clear();
    };
}
