import type { EtapaTreinoDto } from '../../../types/PlanoReview';
import { itensFromEtapas } from '../components/etapas/etapaItem';

const fmtKm = (km: number): string => `${km}`.replace('.', ',');

/** "800 m" abaixo de 1 km, "1,6 km" a partir dele. */
function distancia(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${fmtKm(km)} km`;
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
    const min = parseInt(esforco?.duracaoMin ?? '', 10);
    const medida = km > 0 ? distancia(km) : min > 0 ? `${min} min` : null;
    return medida ? `${bloco.repeticoes} × ${medida}` : null;
}
