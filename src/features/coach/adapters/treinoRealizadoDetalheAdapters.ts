import type { EtapaRealizadaDetalhe, TreinoRealizadoDetalhe } from '../../../types/TreinoRealizado';
import type {
    ExecucaoTreino,
    FaixaZona,
    GrupoDadosRelogio,
    LinhaComparativo,
    LinhaEtapa,
    PlanejadoComparavel,
    TomDiferenca,
    ZonasExecucao,
} from '../types/ExecucaoTreino';
import { decimal, signed } from './format';

/** Tolerâncias da diferença (A8) — validação com treinador piloto na task 0.9. */
export const TOLERANCIA_DISTANCIA_PCT = 0.1;
export const TOLERANCIA_DURACAO_MIN = 10;
export const MINIMO_NO_ALVO_PCT = 60;
export const TOLERANCIA_RPE = 1;

const AUSENTE = '--';

/** Folga de ponto flutuante na fronteira inclusiva: 8 → 8,8 km é exatamente +10 %. */
const EPSILON = 1e-9;

const temValor = (v: number | null | undefined): v is number => v != null && Number.isFinite(v);

/** `HH:MM:SS`, `MM:SS` ou ISO-8601 (`PT1H30M`) em segundos; `null` se ilegível. */
export function segundosDe(valor: string | null | undefined): number | null {
    if (!valor) return null;
    const iso = valor.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
    if (iso) {
        const total = Number(iso[1] ?? 0) * 3600 + Number(iso[2] ?? 0) * 60 + Math.round(Number(iso[3] ?? 0));
        return total > 0 ? total : null;
    }
    const hms = valor.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    if (!hms) return null;
    return Number(hms[1] ?? 0) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
}

/** `1:33:32` ou `47:55`. */
export function formatarTempo(segundos: number | null): string {
    if (!temValor(segundos)) return AUSENTE;
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = Math.round(segundos % 60);
    const mmss = `${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
    return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Ritmo `m:ss /km`, do texto do backend ou derivado da velocidade em km/h. */
export function formatarRitmo(pace: string | null | undefined, kmh?: number | null): string {
    const doTexto = segundosDe(pace);
    const seg = doTexto ?? (temValor(kmh) && kmh > 0 ? Math.round(3600 / kmh) : null);
    return seg ? `${formatarTempo(seg)} /km` : AUSENTE;
}

const km = (v: number | null | undefined, casas = 2) => (temValor(v) ? `${decimal(v, casas)} km` : AUSENTE);
const unidade = (v: number | null | undefined, u: string, casas = 0) => (temValor(v) ? `${decimal(v, casas)} ${u}` : AUSENTE);

function minutosPlanejados(duracao: PlanejadoComparavel['duracaoMin']): number | null {
    if (typeof duracao === 'number') return duracao > 0 ? duracao : null;
    const seg = segundosDe(duracao);
    return seg ? seg / 60 : null;
}

/** `Zn` → {n}; `Zn-Zm` → {n..m}; caixa ignorada. Fora de Z1–Z5 ou ilegível → vazio (D5). */
export function normalizarZonaAlvo(texto: string | null | undefined): Set<number> {
    const m = texto?.trim().match(/^z([1-5])(?:\s*-\s*z?([1-5]))?$/i);
    if (!m) return new Set();
    const de = Number(m[1]);
    const ate = m[2] ? Number(m[2]) : de;
    if (ate < de) return new Set();
    return new Set(Array.from({ length: ate - de + 1 }, (_, i) => de + i));
}

const numeroDaZona = (zona: string) => Number(zona.replace(/\D/g, ''));

function buildZonas(detalhe: TreinoRealizadoDetalhe, zonaAlvo: string | null | undefined): ZonasExecucao | null {
    const zonas = detalhe.tempoEmZonas?.zonas;
    if (!zonas?.length) return null;
    const total = zonas.reduce((soma, z) => soma + z.segundos, 0);
    if (total <= 0) return null;
    const alvo = normalizarZonaAlvo(zonaAlvo);
    const faixas: FaixaZona[] = zonas.map((z) => ({
        zona: z.zona,
        segundos: z.segundos,
        percentual: Math.round((z.segundos / total) * 100),
        tempo: formatarTempo(z.segundos),
        limites: z.bpmMax != null ? `${z.bpmMin}–${z.bpmMax} bpm` : `≥ ${z.bpmMin} bpm`,
        alvo: alvo.has(numeroDaZona(z.zona)),
    }));
    const noAlvo = faixas.filter((f) => f.alvo).reduce((soma, f) => soma + f.segundos, 0);
    return {
        faixas,
        percentualNoAlvo: alvo.size ? Math.round((noAlvo / total) * 100) : null,
        fracaoNoAlvo: alvo.size ? noAlvo / total : null,
    };
}

function linhaDistancia(planejado: PlanejadoComparavel, detalhe: TreinoRealizadoDetalhe): LinhaComparativo {
    const p = temValor(planejado.distanciaKm) && planejado.distanciaKm > 0 ? planejado.distanciaKm : null;
    const r = detalhe.distanciaKm;
    const base = { rotulo: 'Distância', planejado: km(p), realizado: km(r) };
    if (p == null || !temValor(r)) return { ...base, diferenca: AUSENTE, tom: 'neutro' };
    const diff = r - p;
    const tom: TomDiferenca = Math.abs(diff) / p <= TOLERANCIA_DISTANCIA_PCT + EPSILON ? 'ok' : 'atencao';
    return { ...base, diferenca: `${signed(diff, 2)} km`, tom };
}

function linhaDuracao(planejado: PlanejadoComparavel, detalhe: TreinoRealizadoDetalhe): LinhaComparativo {
    const pMin = minutosPlanejados(planejado.duracaoMin);
    // Tempo em movimento: no .fit `duracaoMin` inclui as pausas (task 0.2).
    const rSeg = segundosDe(detalhe.runningDynamics?.tempoMovimento) ?? segundosDe(detalhe.duracaoMin);
    const base = {
        rotulo: 'Duração',
        planejado: pMin != null ? formatarTempo(pMin * 60) : AUSENTE,
        realizado: formatarTempo(rSeg),
    };
    if (pMin == null || rSeg == null) return { ...base, diferenca: AUSENTE, tom: 'neutro' };
    // Compara o valor exato; só a exibição arredonda (70min29s contra 60 é +10 na tela, mas fora).
    const diffExato = rSeg / 60 - pMin;
    const diffMin = Math.round(diffExato);
    return {
        ...base,
        diferenca: `${diffMin > 0 ? '+' : ''}${diffMin} min`,
        tom: Math.abs(diffExato) <= TOLERANCIA_DURACAO_MIN + EPSILON ? 'ok' : 'atencao',
    };
}

function linhaZona(planejado: PlanejadoComparavel, zonas: ZonasExecucao | null): LinhaComparativo {
    const predominante = zonas?.faixas.reduce((maior, f) => (f.segundos > maior.segundos ? f : maior));
    const base = {
        rotulo: 'Zona',
        planejado: planejado.zonaAlvo?.trim() || AUSENTE,
        realizado: predominante ? predominante.zona : AUSENTE,
    };
    if (zonas?.percentualNoAlvo == null) return { ...base, diferenca: AUSENTE, tom: 'neutro' };
    return {
        ...base,
        diferenca: `${zonas.percentualNoAlvo}% no alvo`,
        // Fração exata: 59,5 % aparece "60%", mas está fora.
        tom: (zonas.fracaoNoAlvo ?? 0) * 100 >= MINIMO_NO_ALVO_PCT - EPSILON ? 'ok' : 'atencao',
    };
}

function linhaRpe(planejado: PlanejadoComparavel, detalhe: TreinoRealizadoDetalhe): LinhaComparativo {
    const p = planejado.percepcaoEsforcoEsperada;
    const r = detalhe.percepcaoEsforco;
    const base = {
        rotulo: 'RPE',
        planejado: temValor(p) ? `${p}/10` : AUSENTE,
        realizado: temValor(r) ? `${r}/10` : AUSENTE,
    };
    if (!temValor(p) || !temValor(r)) return { ...base, diferenca: AUSENTE, tom: 'neutro' };
    const diff = r - p;
    return { ...base, diferenca: diff === 0 ? '0' : signed(diff, 0), tom: Math.abs(diff) <= TOLERANCIA_RPE ? 'ok' : 'atencao' };
}

function elevacao(ganho?: number, perda?: number): string {
    if (!temValor(ganho) && !temValor(perda)) return AUSENTE;
    return `${temValor(ganho) ? `+${ganho} m` : AUSENTE} / ${temValor(perda) ? `−${perda} m` : AUSENTE}`;
}

function linhaEtapa(e: EtapaRealizadaDetalhe, indice: number): LinhaEtapa {
    return {
        rotulo: `Volta ${e.ordem ?? indice + 1}`,
        distancia: km(e.distanciaKm),
        tempo: formatarTempo(segundosDe(e.duracao)),
        ritmo: formatarRitmo(e.paceMedia, e.velocidadeMedia),
        fcMedia: unidade(e.fcMedia, 'bpm'),
        fcMax: unidade(e.fcMax, 'bpm'),
        cadencia: unidade(e.cadenciaMedia, 'ppm'),
        potencia: unidade(e.potenciaMedia, 'W'),
        elevacao: elevacao(e.elevacaoGanhoMetros, e.elevacaoPerdaMetros),
    };
}

function buildGrupos(d: TreinoRealizadoDetalhe): GrupoDadosRelogio[] {
    const rd = d.runningDynamics;
    const grau = (v: number | null | undefined, casas: number) => (temValor(v) ? `${decimal(v, casas)} °C` : AUSENTE);
    return [
        {
            titulo: 'Distância e tempo',
            itens: [
                { rotulo: 'Distância', valor: km(d.distanciaKm) },
                { rotulo: 'Tempo', valor: formatarTempo(segundosDe(d.duracaoMin)) },
                { rotulo: 'Tempo em movimento', valor: formatarTempo(segundosDe(rd?.tempoMovimento)) },
                { rotulo: 'Tempo decorrido', valor: formatarTempo(d.elapsedTimeSeg ?? null) },
            ],
        },
        {
            titulo: 'Ritmo',
            itens: [
                { rotulo: 'Ritmo médio', valor: formatarRitmo(d.paceMedia, d.velocidadeMedia) },
                { rotulo: 'Melhor ritmo', valor: formatarRitmo(null, d.velocidadeMaxKmh) },
            ],
        },
        {
            titulo: 'Frequência cardíaca',
            itens: [
                { rotulo: 'FC média', valor: unidade(d.fcMedia, 'bpm') },
                { rotulo: 'FC máxima', valor: unidade(d.fcMax, 'bpm') },
            ],
        },
        {
            titulo: 'Dinâmica de corrida',
            itens: [
                { rotulo: 'Cadência média', valor: unidade(d.cadenciaMedia, 'ppm') },
                { rotulo: 'Comprimento médio da passada', valor: unidade(rd?.passadaMediaM, 'm', 2) },
                { rotulo: 'Proporção vertical', valor: unidade(rd?.proporcaoVerticalPct, '%', 1) },
                { rotulo: 'Oscilação vertical', valor: unidade(rd?.oscilacaoVerticalCm, 'cm', 1) },
                {
                    rotulo: 'Equilíbrio de GCT',
                    valor: temValor(rd?.gctEquilibrioPct)
                        ? `${decimal(rd.gctEquilibrioPct, 1)}% E / ${decimal(100 - rd.gctEquilibrioPct, 1)}% D`
                        : AUSENTE,
                },
                { rotulo: 'Tempo de contato com o solo', valor: unidade(rd?.gctMedioMs, 'ms') },
            ],
        },
        {
            titulo: 'Elevação',
            itens: [
                { rotulo: 'Subida total', valor: unidade(d.elevacaoGanhoMetros, 'm') },
                { rotulo: 'Descida total', valor: unidade(d.elevacaoPerdaMetros, 'm') },
            ],
        },
        { titulo: 'Potência', itens: [{ rotulo: 'Potência média', valor: unidade(d.potenciaMedia, 'W') }] },
        {
            titulo: 'Ambiente e corpo',
            itens: [
                { rotulo: 'Temperatura média', valor: grau(rd?.temperaturaMediaC, 1) },
                { rotulo: 'Temperatura mínima', valor: grau(d.temperaturaMinC, 0) },
                { rotulo: 'Temperatura máxima', valor: grau(d.temperaturaMaxC, 0) },
                { rotulo: 'Calorias', valor: unidade(rd?.calorias, 'kcal') },
            ],
        },
        {
            // Q2: só o que o atleta informou — RPE e comentário.
            titulo: 'Percepção do atleta',
            itens: [
                { rotulo: 'Esforço percebido', valor: temValor(d.percepcaoEsforco) ? `${d.percepcaoEsforco}/10` : AUSENTE },
                { rotulo: 'Comentário', valor: d.feedbackAtleta?.trim() || AUSENTE },
            ],
        },
    ];
}

/** Detalhe do realizado + planejado → tela de execução (D4, D5). Pura. */
export function buildExecucaoFromDetalhe(detalhe: TreinoRealizadoDetalhe, planejado: PlanejadoComparavel): ExecucaoTreino {
    const zonas = buildZonas(detalhe, planejado.zonaAlvo);
    const etapas = [...(detalhe.etapasRealizadas ?? [])]
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map(linhaEtapa);
    const total: LinhaEtapa | null = etapas.length
        ? {
            rotulo: 'Total',
            distancia: km(detalhe.distanciaKm),
            tempo: formatarTempo(segundosDe(detalhe.duracaoMin)),
            ritmo: formatarRitmo(detalhe.paceMedia, detalhe.velocidadeMedia),
            fcMedia: unidade(detalhe.fcMedia, 'bpm'),
            fcMax: unidade(detalhe.fcMax, 'bpm'),
            cadencia: unidade(detalhe.cadenciaMedia, 'ppm'),
            potencia: unidade(detalhe.potenciaMedia, 'W'),
            elevacao: elevacao(detalhe.elevacaoGanhoMetros, detalhe.elevacaoPerdaMetros),
        }
        : null;

    return {
        comparativo: [
            linhaDistancia(planejado, detalhe),
            linhaDuracao(planejado, detalhe),
            {
                rotulo: 'Ritmo',
                planejado: planejado.ritmoAlvo?.trim() || AUSENTE,
                realizado: formatarRitmo(detalhe.paceMedia, detalhe.velocidadeMedia),
                diferenca: AUSENTE,
                tom: 'neutro',
            },
            linhaZona(planejado, zonas),
            { rotulo: 'FC média', planejado: AUSENTE, realizado: unidade(detalhe.fcMedia, 'bpm'), diferenca: AUSENTE, tom: 'neutro' },
            linhaRpe(planejado, detalhe),
        ],
        zonas,
        etapas,
        total,
        grupos: buildGrupos(detalhe),
    };
}
