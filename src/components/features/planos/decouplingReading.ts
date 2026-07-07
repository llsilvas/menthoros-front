export type DecouplingTone = 'success' | 'warning' | 'danger';

// Faixas (fonte única): < 5 (inclui negativos) verde · [5, 10] âmbar · > 10 vermelho.
export function decouplingTone(value: number): DecouplingTone {
    if (value < 5) return 'success';
    if (value <= 10) return 'warning';
    return 'danger';
}

// Leitura descritiva, NÃO causal (a Opção 1 não separa fadiga de terreno/vento).
export function decouplingLeitura(value: number): string {
    if (value < 5) return 'Eficiência bem sustentada';
    if (value <= 10) return 'Eficiência caindo na 2ª metade';
    return 'Queda de eficiência acentuada';
}
