// Política de agrupamento de série do perfil.
//
// Fica fora do seletor porque não é fórmula: é uma decisão sobre o que conta
// como série neste contexto, com vocabulário próprio, e o seletor já carrega
// zona, blocos e métricas. O algoritmo genérico vive em `serie/janelaRepetida`.

import type { ProfileEtapaInput } from './input';
import { detectarJanelaRepetida } from '../serie/janelaRepetida';

/** Decide o papel do bloco. Duplica a intenção de `papelDe`, injetado pelo seletor. */
export type PapelDeTipo = (tipo: string) => string;

/**
 * Marca as séries que o backend entregou expandidas, sem `blocoId`.
 *
 * Treinos gerados pela IA nascem sem agrupamento: chegam como N repetições
 * planas. Sem isto o gráfico desenha N blocos avulsos, sem bracket e com o
 * rótulo repetido em cada um — o ruído que a §4.5 da spec existe para evitar.
 *
 * O `blocoId` explícito, quando existe, manda: ele é dado, e isto é inferência.
 * O id sintético (`inferido-N`) nunca sai deste módulo de leitura — o caminho de
 * escrita do editor tem o próprio agrupamento e não lê daqui.
 *
 * O vocabulário difere do editor em dois pontos deliberados: a assinatura não
 * inclui distância, porque `ProfileEtapaInput` não a carrega; e o esforço é
 * reconhecido pelo mesmo `papelDe` que o resto do módulo usa — `INTERVALADO`,
 * mas também `tiro`, `esforço` e afins. O editor reconhece só `INTERVALADO`,
 * para espelhar o backend; aqui, aceitar menos faria a série sumir do gráfico
 * num treino que o próprio módulo já trata como trabalho.
 */
export function inferirSeries(
  etapas: ProfileEtapaInput[],
  papelDe: PapelDeTipo,
): ProfileEtapaInput[] {
  const vocabulario = {
    assinatura: (e: ProfileEtapaInput) => `${e.tipo}|${e.duracaoMin}|${e.fcAlvo}`,
    ehTrabalho: (e: ProfileEtapaInput) => papelDe(e.tipo) === 'work',
  };

  const saida: ProfileEtapaInput[] = [];
  let i = 0;
  let grupo = 0;

  while (i < etapas.length) {
    if (etapas[i].blocoId) {
      saida.push(etapas[i]);
      i++;
      continue;
    }

    // A janela não atravessa uma etapa que já tem agrupamento próprio.
    let limite = i;
    while (limite < etapas.length && !etapas[limite].blocoId) limite++;

    const serie = detectarJanelaRepetida(etapas, i, limite, vocabulario);
    if (!serie) {
      saida.push(etapas[i]);
      i++;
      continue;
    }

    const groupId = `inferido-${grupo++}`;
    for (let r = 1; r <= serie.reps; r++) {
      for (let p = 0; p < serie.janela; p++) {
        saida.push({
          ...etapas[i + (r - 1) * serie.janela + p],
          blocoId: groupId,
          blocoRepeticoes: serie.reps,
          blocoRepeticaoIndex: r,
        });
      }
    }
    i += serie.janela * serie.reps;
  }

  return saida;
}
