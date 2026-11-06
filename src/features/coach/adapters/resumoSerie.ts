import type { EtapaTreinoDto } from '../../../types/PlanoReview';
import { itensFromEtapas, segundosDe } from '../components/etapas/etapaItem';

const fmtKm = (km: number): string => `${km}`.replace('.', ',');

/** "800 m" abaixo de 1 km, "1,6 km" a partir dele. */
function distancia(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${fmtKm(km)} km`;
}

/** "4 min" em minuto cheio; "4:10" quando tem segundos. */
function tempo(seg: number): string {
    return seg % 60 === 0 ? `${seg / 60} min` : `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
}

/**
 * Resumo da primeira série do treino ("6 × 800 m"), para o rótulo do card. Usa o mesmo agrupamento do
 * editor (`itensFromEtapas`), então vale tanto para série gravada com `blocoId` quanto para a
 * repetição que a IA expande sem agrupar. `null` quando o treino não tem série.
 */
export function resumoDaSerie(etapas: EtapaTreinoDto[] | undefined): string | null {
    const bloco = itensFromEtapas(etapas).find((i) => i.kind === 'block');
    if (!bloco || bloco.kind !== 'block') return null;

    const esforco = bloco.steps.find((s) => s.tipoEtapa?.toUpperCase() === 'INTERVALADO') ?? bloco.steps[0];
    const km = parseFloat(esforco?.distanciaKm ?? '');
    const seg = segundosDe(esforco?.duracao ?? '') ?? 0;
    const medida = km > 0 ? distancia(km) : seg > 0 ? tempo(seg) : null;
    return medida ? `${bloco.repeticoes} × ${medida}` : null;
}
