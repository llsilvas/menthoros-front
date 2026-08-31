/**
 * Labels canônicos do RPE (1–10) — compartilhados entre o formulário de registro
 * (`ManualTrainingForm`) e o card de análise do treino (analise-ia-treino-atleta, task 3.2):
 * antes viviam duplicados no formulário e divergiriam em silêncio.
 */
export const RPE_LABELS: Record<number, string> = {
    1: 'Muito fácil', 2: 'Muito fácil',
    3: 'Fácil', 4: 'Fácil',
    5: 'Moderado', 6: 'Moderado',
    7: 'Difícil', 8: 'Difícil',
    9: 'Máximo', 10: 'Máximo',
};

export const rpeLabel = (rpe: number): string => RPE_LABELS[rpe] ?? '';
