import type { AthleteTrainingZoneDto } from '../../../types/AthleteTrainingZones';

/**
 * Faixa de FC esperada para o tipo da etapa — porte de `EtapaFcValidator.zonaEsperadaFC` (backend,
 * `services/helper/EtapaFcValidator.java`). Se a tabela mudar lá, mudar aqui: o aviso do editor e a
 * correção da IA têm de concordar sobre o que é "fora da faixa".
 */
export function faixaFcTipica(
    tipoEtapa: string,
    tipoTreino: string | undefined,
    zonas: AthleteTrainingZoneDto[],
): { min: number; max: number } | null {
    const z = (n: number) => zonas.find((x) => x.numero === n)?.fc;
    const entre = (de: number, ate: number) => {
        const a = z(de);
        const b = z(ate);
        return a && b ? { min: a.min, max: b.max } : null;
    };

    switch (tipoEtapa.toUpperCase()) {
        case 'AQUECIMENTO':
        case 'DESAQUECIMENTO':
            return entre(1, 1);
        case 'RECUPERACAO':
            return tipoTreino?.toUpperCase() === 'FARTLEK' ? entre(1, 2) : entre(1, 1);
        // O Javadoc do backend promete Z4–Z5 para INTERVALADO, mas o código usa a tabela da PRINCIPAL
        // (`zonaParaEtapaPrincipal`) — o porte segue o código.
        case 'PRINCIPAL':
        case 'INTERVALADO':
            return faixaDoTreino(tipoTreino, entre);
        default:
            return null;
    }
}

function faixaDoTreino(
    tipoTreino: string | undefined,
    entre: (de: number, ate: number) => { min: number; max: number } | null,
) {
    switch (tipoTreino?.toUpperCase()) {
        case 'REGENERATIVO': return entre(1, 2);
        case 'CONTINUO':
        case 'FACIL':
        case 'LONGO': return entre(2, 3);
        case 'FARTLEK': return entre(2, 4);
        case 'TEMPO_RUN': return entre(3, 4);
        case 'INTERVALADO':
        case 'TIRO': return entre(4, 5);
        default: return entre(2, 4);
    }
}
