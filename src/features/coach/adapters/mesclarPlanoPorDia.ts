import type { DiaSemanaDto, RestDayDto, TreinoPlanejadoDto } from '../../../types/PlanoReview';

/**
 * Funde os treinos e os descansos de um plano numa lista única, na ordem da semana
 * (show-descanso-no-plano, CA6).
 *
 * Duas regras que não são óbvias e estão no CA:
 * - **Nenhum treino é descartado.** O produto permite dois treinos no mesmo dia, e um treino com dia
 *   irreconhecível vai para o fim em vez de sumir — sumir em silêncio é o defeito que esta feature
 *   inteira existe para acabar.
 * - **Treino vence descanso no mesmo dia.** Só acontece com dado inconsistente do backend (ele
 *   remove o descanso ao criar treino), mas a tela precisa de uma regra determinística.
 *
 * A ordenação vale **sempre**, inclusive em plano sem descanso — é mudança deliberada para plano
 * antigo (CA2b), não efeito colateral.
 */

const ORDEM_SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'] as const;

export type ItemDoPlano =
    | { kind: 'treino'; dia: string; treino: TreinoPlanejadoDto }
    | { kind: 'descanso'; dia: string; descanso: RestDayDto };

function normalizarDia(dia: string | DiaSemanaDto | null | undefined): string {
    if (dia == null) return '';
    const bruto = typeof dia === 'string' ? dia : (dia.value ?? dia.short ?? dia.label ?? '');
    return bruto.trim().toUpperCase();
}

/** Índice na semana; dia desconhecido vai para o fim, preservando a ordem de chegada. */
function ordem(dia: string): number {
    const i = ORDEM_SEMANA.indexOf(dia as (typeof ORDEM_SEMANA)[number]);
    return i === -1 ? ORDEM_SEMANA.length : i;
}

export function mesclarPlanoPorDia(
    treinos: TreinoPlanejadoDto[] | null | undefined,
    restDays: RestDayDto[] | null | undefined,
): ItemDoPlano[] {
    const listaTreinos = treinos ?? [];
    const listaDescansos = restDays ?? [];

    const itens: ItemDoPlano[] = listaTreinos.map((treino) => ({
        kind: 'treino' as const,
        dia: normalizarDia(treino.diaSemana),
        treino,
    }));

    const diasComTreino = new Set(itens.map((i) => i.dia).filter(Boolean));
    const diasDeDescansoJaVistos = new Set<string>();

    for (const descanso of listaDescansos) {
        const dia = normalizarDia(descanso.dayOfWeek);
        // Dia irreconhecível: descartar é seguro aqui (não há dia a preencher), ao contrário do treino.
        if (!dia || ordem(dia) === ORDEM_SEMANA.length) continue;
        if (diasComTreino.has(dia) || diasDeDescansoJaVistos.has(dia)) continue;
        diasDeDescansoJaVistos.add(dia);
        itens.push({ kind: 'descanso', dia, descanso });
    }

    // Estável: dois treinos no mesmo dia mantêm a ordem em que vieram.
    return itens
        .map((item, i) => ({ item, i }))
        .sort((a, b) => ordem(a.item.dia) - ordem(b.item.dia) || a.i - b.i)
        .map(({ item }) => item);
}
