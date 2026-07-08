export type DecouplingTone = 'success' | 'warning' | 'danger';

const DECOUPLING_WARNING_THRESHOLD = 5;   // % — início da queda perceptível
const DECOUPLING_DANGER_THRESHOLD  = 10;  // % — queda acentuada

export function decouplingTone(value: number): DecouplingTone {
    if (value < DECOUPLING_WARNING_THRESHOLD) return 'success';
    if (value <= DECOUPLING_DANGER_THRESHOLD) return 'warning';
    return 'danger';
}

// Descritivo, NÃO causal — Opção 1 não separa fadiga de terreno/vento.
export function decouplingLabel(value: number): string {
    if (value < DECOUPLING_WARNING_THRESHOLD) return 'Eficiência bem sustentada';
    if (value <= DECOUPLING_DANGER_THRESHOLD) return 'Eficiência caindo na 2ª metade';
    return 'Queda de eficiência acentuada';
}
