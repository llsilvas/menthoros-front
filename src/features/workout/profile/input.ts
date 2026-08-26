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

/**
 * Detalhe do treino — `src/types/TreinoPlanejado.ts`. Leva `blocoId`/`blocoRepeticoes` quando o
 * contrato os traz, mas **não** o índice da repetição, que não existe no contrato: para a série
 * ganhar o bracket "N×" use `indexarRepeticoes` sobre a lista, que deriva o índice por posição.
 */
export function fromEtapaTreino(e: EtapaTreino): ProfileEtapaInput {
  return {
    id:              e.id,
    ordem:           e.ordem,
    tipo:            tipoDe(e.tipoEtapa),
    descricao:       e.descricaoEtapa,
    duracaoMin:      e.duracaoMin,
    fcAlvo:          e.fcAlvoEtapa,
    ritmoAlvo:       e.ritmoAlvo,
    intensidade:     e.intensidade,
    repeticoes:      e.repeticoes,
    observacao:      e.observacao,
    blocoId:         e.blocoId,
    blocoRepeticoes: e.blocoRepeticoes,
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
        descricao:  item.descricaoEtapa,
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
        descricao:  sub.descricaoEtapa,
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
          descricao:           sub.descricaoEtapa,
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

/**
 * Deriva `blocoRepeticaoIndex` por posição sobre uma série **já expandida** pelo backend
 * (`expandirBloco` grava N × sub-etapas linhas com o mesmo `blocoId`): num grupo consecutivo de
 * tamanho `k` com `N = blocoRepeticoes`, o ciclo é `c = k / N` e o índice é `⌊pos / c⌋ + 1`.
 * Grupo com `k` não múltiplo de `N` é inválido: as etapas **perdem** `blocoId`/`blocoRepeticoes`,
 * porque o `selectWorkoutProfile` criaria `repeat` com `index ?? 1` e desenharia um bracket
 * falso. Nunca reexpande — um 4×2 já chega como 8 linhas.
 */
export function indexarRepeticoes(etapas: ProfileEtapaInput[]): ProfileEtapaInput[] {
  const saida: ProfileEtapaInput[] = [];
  let i = 0;
  while (i < etapas.length) {
    const atual = etapas[i];
    const grupoId = atual.blocoId;
    const reps = atual.blocoRepeticoes ?? 0;
    if (!grupoId || reps <= 1) {
      saida.push(atual);
      i += 1;
      continue;
    }
    let fim = i;
    while (fim < etapas.length && etapas[fim].blocoId === grupoId) fim += 1;
    const grupo = etapas.slice(i, fim);
    const k = grupo.length;
    if (k % reps !== 0) {
      for (const e of grupo) saida.push({ ...e, blocoId: undefined, blocoRepeticoes: undefined, blocoRepeticaoIndex: undefined });
    } else {
      const ciclo = k / reps;
      grupo.forEach((e, pos) => saida.push({ ...e, blocoRepeticaoIndex: Math.floor(pos / ciclo) + 1 }));
    }
    i = fim;
  }
  return saida;
}
