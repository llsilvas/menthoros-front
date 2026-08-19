// Detecção de série por repetição observada.
//
// Existe porque duas telas precisam da MESMA resposta para "isto é uma série?":
// o editor de treinos, que reconstrói blocos a partir das etapas planas do
// backend, e o perfil do treino, que desenha o bracket `n×`. Duas
// implementações divergiriam — e o editor e o gráfico passariam a discordar
// sobre o mesmo treino, que é a classe de bug que este módulo existe para matar.
//
// O que difere entre os dois não é o algoritmo, são dois vocabulários:
//   - **assinatura**: quais campos fazem duas etapas ocuparem o mesmo papel.
//     O editor inclui `distanciaKm`; o perfil não o tem no seu tipo de entrada.
//   - **trabalho**: o editor reconhece só `INTERVALADO`; o perfil reconhece
//     também `tiro`, `esforço` e afins, pelo mesmo `papelDe` que usa no resto.
// Por isso são injetados, em vez de embutidos.

export interface JanelaRepetida {
  /** Tamanho da janela que se repete (2 = pares esforço+recuperação). */
  janela: number;
  /** Quantas vezes ela se repete. Sempre ≥ 2. */
  reps: number;
}

export interface OpcoesJanela<T> {
  /** Duas etapas com a mesma assinatura ocupam o mesmo papel na série. */
  assinatura: (item: T) => string;
  /** Uma série tem esforço: sem isso, a repetição é coincidência, não bloco. */
  ehTrabalho: (item: T) => boolean;
}

/**
 * Procura, a partir de `inicio`, a janela repetida que cobre mais etapas até
 * `limite` (exclusivo). Devolve `null` quando não há série.
 *
 * Empate em cobertura é desempatado pelo maior número de repetições: `5×(1)`
 * descreve melhor um treino que `1×(5)` — e este último nem é série.
 */
export function detectarJanelaRepetida<T>(
  itens: T[],
  inicio: number,
  limite: number,
  { assinatura, ehTrabalho }: OpcoesJanela<T>,
): JanelaRepetida | null {
  const disponivel = limite - inicio;
  if (disponivel < 2) return null;

  const assinaturas = itens.map(assinatura);

  const janelaEquivalente = (a: number, b: number, janela: number) => {
    for (let p = 0; p < janela; p++) {
      if (assinaturas[a + p] !== assinaturas[b + p]) return false;
    }
    return true;
  };

  const contemTrabalho = (de: number, janela: number) => {
    for (let p = de; p < de + janela; p++) {
      if (ehTrabalho(itens[p])) return true;
    }
    return false;
  };

  let melhorJanela = 0;
  let melhorReps = 0;

  for (let janela = 1; janela <= Math.floor(disponivel / 2); janela++) {
    if (!contemTrabalho(inicio, janela)) continue;

    let reps = 1;
    let proxima = inicio + janela;
    while (proxima + janela <= limite && janelaEquivalente(inicio, proxima, janela)) {
      reps++;
      proxima += janela;
    }
    if (reps < 2) continue;

    const cobertura = janela * reps;
    if (cobertura > melhorJanela * melhorReps
      || (cobertura === melhorJanela * melhorReps && reps > melhorReps)) {
      melhorJanela = janela;
      melhorReps = reps;
    }
  }

  return melhorReps >= 2 ? { janela: melhorJanela, reps: melhorReps } : null;
}
