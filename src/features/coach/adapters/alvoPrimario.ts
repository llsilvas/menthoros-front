import type { AlvoPrimario } from '../../../types/AthleteTrainingZones';
import type { ZoneKey } from '../../workout/profile/types';

const TIPOS_DE_PACE = new Set(['INTERVALADO', 'TIRO']);
const ZONAS_DE_PACE: ReadonlySet<string> = new Set<ZoneKey>(['Z5', 'Z6']);

/**
 * Eixo que o seletor de zona pré-preenche (design D5). Só pré-preenchimento: o treinador troca num
 * clique, e a regra não é reaplicada depois que ele toca. Em tiro a FC leva 1–2 min para estabilizar,
 * por isso pace; nas demais, FC.
 */
export function defaultAlvoPrimario(
    tipoEtapa: string,
    zona: ZoneKey | 'PERSONALIZADO' | null,
): Exclude<AlvoPrimario, 'NENHUM'> {
    if (TIPOS_DE_PACE.has(tipoEtapa.toUpperCase())) return 'PACE';
    if (zona && ZONAS_DE_PACE.has(zona)) return 'PACE';
    return 'FC';
}
