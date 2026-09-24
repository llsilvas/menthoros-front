import { ORDEM_DIAS, indiceDoDia } from '../../../utils/semana';
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
    const i = indiceDoDia(dia);
    return i === -1 ? ORDEM_DIAS.length : i;
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
        // Assimetria deliberada com o treino: descanso descartado não deixa buraco na semana (o dia
        // segue lá, só sem a tarja), então descartar é seguro. Mas descarte silencioso já mascarou
        // bug de backend antes — daí o aviso. Sem PII: só o dia.
        if (!dia || ordem(dia) === ORDEM_DIAS.length) {
            console.warn('[plano] descanso com dia irreconhecível ignorado:', descanso.dayOfWeek);
            continue;
        }
        if (diasComTreino.has(dia)) continue; // regra do CA6: treino vence descanso
        if (diasDeDescansoJaVistos.has(dia)) {
            console.warn('[plano] descanso duplicado no mesmo dia ignorado:', dia);
            continue;
        }
        diasDeDescansoJaVistos.add(dia);
        itens.push({ kind: 'descanso', dia, descanso });
    }

    // Estável: dois treinos no mesmo dia mantêm a ordem em que vieram.
    return itens
        .map((item, i) => ({ item, i }))
        .sort((a, b) => ordem(a.item.dia) - ordem(b.item.dia) || a.i - b.i)
        .map(({ item }) => item);
}
