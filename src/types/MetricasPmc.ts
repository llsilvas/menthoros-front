/**
 * Ponto da série PMC do endpoint coach-scoped `GET /api/v1/atletas/{id}/metricas/historico`.
 *
 * Espelha `PmcPontoDto` do backend: campos numéricos são anuláveis (`@JsonInclude(NON_NULL)`
 * omite quando ausentes) e `statusForma` é o nome da faixa (`FaixaTsb`) resolvida pelo backend.
 */
export interface PmcHistoricoPonto {
    /** Data do ponto (ISO `yyyy-MM-dd`). */
    data: string;
    /** CTL (fitness); ausente quando sem métricas no dia. */
    ctl?: number;
    /** ATL (fadiga); ausente quando sem métricas no dia. */
    atl?: number;
    /** TSB (forma) = CTL − ATL; ausente quando sem métricas no dia. */
    tsb?: number;
    /** Training Stress Score do dia; ausente quando sem treino. */
    tss?: number;
    /** Faixa de forma (`FaixaTsb`) resolvida no backend; ausente quando `tsb` ausente. */
    statusForma?: string;
}
