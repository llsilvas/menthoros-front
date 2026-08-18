// Entrada normalizada do seletor, e os adaptadores das três formas de etapa que
// existem no app (design §2 e §2.1 da change).
//
// O seletor recebe UMA forma. Aceitar as três lá dentro empurraria o
// `typeof tipoEtapa === 'object'` para o meio do cálculo — o mesmo parsing
// defensivo do `toWorkoutBlocks` que esta change existe para eliminar. Aqui a
// divergência entre as fontes fica na borda, visível e testada.

import type { EtapaTreino } from '../../../types/TreinoPlanejado';
import type { EtapaTreinoDto } from '../../../types/PlanoReview';
import type { EtapaItem } from '../../coach/components/etapas/etapaItem';

export interface ProfileEtapaInput {
  id?: string;
  ordem?: number;
  /** Já resolvido para string pelo adaptador. */
  tipo: string;
  descricao?: string;
  duracaoMin?: number;
  fcAlvo?: string;
  ritmoAlvo?: string;
  intensidade?: string;
  repeticoes?: number;
  /** Ausente no detalhe do treino. Ausente, nunca inventado. */
  blocoId?: string;
  blocoRepeticoes?: number;
  /** 1-based, presente junto com `blocoId`. */
  blocoRepeticaoIndex?: number;
  observacao?: string;
}

/** `tipoEtapa` chega como string ou como o enum serializado com @JsonFormat(OBJECT). */
function tipoDe(tipoEtapa: EtapaTreino['tipoEtapa']): string {
  if (typeof tipoEtapa === 'string') return tipoEtapa;
  return tipoEtapa?.value ?? tipoEtapa?.label ?? '';
}

/** Detalhe do treino — `src/types/TreinoPlanejado.ts`. Sem `blocoId`, logo sem série. */
export function fromEtapaTreino(e: EtapaTreino): ProfileEtapaInput {
  return {
    id:          e.id,
    ordem:       e.ordem,
    tipo:        tipoDe(e.tipoEtapa),
    descricao:   e.descricaoEtapa,
    duracaoMin:  e.duracaoMin,
    fcAlvo:      e.fcAlvoEtapa,
    ritmoAlvo:   e.ritmoAlvo,
    intensidade: e.intensidade,
    repeticoes:  e.repeticoes,
    observacao:  e.observacao,
  };
}

/** Treino salvo na revisão — `src/types/PlanoReview.ts`. Único com `blocoId`. */
export function fromEtapaTreinoDto(e: EtapaTreinoDto): ProfileEtapaInput {
  return {
    ordem:           e.ordem,
    tipo:            e.tipoEtapa,
    descricao:       e.descricaoEtapa,
    duracaoMin:      e.duracaoMin,
    fcAlvo:          e.fcAlvoEtapa,
    repeticoes:      e.repeticoes,
    blocoId:         e.blocoId,
    blocoRepeticoes: e.blocoRepeticoes,
  };
}

/**
 * Editor ao vivo — `EtapaItem[]` do `TreinoEditDialog`.
 *
 * Recebe a **lista**, não um item: um `BlockRow` de `reps × steps` vira N
 * entradas no eixo, e essa expansão só existe no nível da lista. Adaptar do DTO
 * salvo aqui desenharia o treino gravado, não o que o treinador está montando.
 */
export function fromEtapaItens(itens: EtapaItem[]): ProfileEtapaInput[] {
  return itens.flatMap((item): ProfileEtapaInput[] => {
    if (item.kind === 'step') {
      return [{
        id:         `step-${item.id}`,
        tipo:       item.tipoEtapa,
        duracaoMin: minutosDe(item.duracaoMin),
        fcAlvo:     item.fcAlvoEtapa || undefined,
      }];
    }

    const reps = Math.max(1, parseInt(item.repeticoes, 10) || 1);

    // Um bloco de uma repetição não é uma série. Emitir `blocoId` aqui faria o
    // componente desenhar um bracket "1×" sobre um bloco solto — afirmar uma
    // estrutura que o treinador não montou.
    if (reps <= 1) {
      return item.steps.map((sub) => ({
        id:         `bloco-${item.id}-1-${sub.id}`,
        tipo:       sub.tipoEtapa,
        duracaoMin: minutosDe(sub.duracaoMin),
        fcAlvo:     sub.fcAlvoEtapa || undefined,
      }));
    }

    const entradas: ProfileEtapaInput[] = [];
    for (let r = 1; r <= reps; r++) {
      for (const sub of item.steps) {
        entradas.push({
          // Ancorado em `item.id`/`sub.id`, que são estáveis no modelo de edição.
          // Usar o índice da lista faria o id mudar a cada reordenação, e o
          // destaque sincronizado com a linha em edição piscaria.
          id:                  `bloco-${item.id}-${r}-${sub.id}`,
          tipo:                sub.tipoEtapa,
          duracaoMin:          minutosDe(sub.duracaoMin),
          fcAlvo:              sub.fcAlvoEtapa || undefined,
          blocoId:             item.id,
          blocoRepeticoes:     reps,
          blocoRepeticaoIndex: r,
        });
      }
    }
    return entradas;
  });
}

function minutosDe(valor: string): number | undefined {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) ? n : undefined;
}
