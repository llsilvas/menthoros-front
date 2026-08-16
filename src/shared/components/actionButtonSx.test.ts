import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DANGER_BTN_SX, GHOST_BTN_SX, PRIMARY_BTN_SX, SUCCESS_BTN_SX } from './actionButtonSx';

/**
 * Escopo da varredura: shell do coach + componentes compartilhados. As telas do atleta têm
 * infratores próprios (7 arquivos na última contagem), mas migrá-las é Non-Goal explícito desta
 * change — incluí-las aqui deixaria o teste vermelho por dívida que não é dela, e um teste que
 * nasce vermelho é um teste que alguém desativa.
 */
const RAIZES = [
  resolve(__dirname, '../../features/coach'),
  resolve(__dirname, '..'),
];
const SRC = resolve(__dirname, '../..');

function arquivosFonte(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) arquivosFonte(caminho, acc);
    else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) acc.push(caminho);
  }
  return acc;
}

/** `primary[…]`/`semantic.*[…]` como fundo = cor de ação inline, que é o que a regra proíbe. */
const COR_DE_ACAO = /bgcolor:\s*(semantic\.\w+\[|primary\[)/;

describe('papéis de botão', () => {
  it('os quatro papéis existem e são distintos', () => {
    const cores = [PRIMARY_BTN_SX.bgcolor, SUCCESS_BTN_SX.bgcolor, DANGER_BTN_SX.bgcolor];

    expect(new Set(cores).size).toBe(3);
    expect(GHOST_BTN_SX).not.toHaveProperty('bgcolor');
  });

  /**
   * A regra: `semantic.*` é **estado** (chip, badge, dot); `_BTN_SX` é **ação**. Quando um botão
   * define a própria cor inline, ele sai do canônico sem que ninguém perceba — foi o que aconteceu
   * com o `ConfirmDialog`, que reimplementou PRIMARY com hover `primary[600]` enquanto o canônico
   * usa `primary[400]`: dois botões primários do mesmo produto reagindo diferente ao mouse.
   *
   * Este teste é o guard-rail que a task 2.9 pede. Ele varre a fonte porque a alternativa —
   * confiar em revisão — já falhou uma vez.
   */
  it('nenhum botão define cor de fundo semântica inline', () => {
    const infratores: string[] = [];

    for (const arquivo of RAIZES.flatMap((raiz) => arquivosFonte(raiz))) {
      if (arquivo.endsWith('actionButtonSx.ts')) continue; // a definição canônica é o único lugar
      const conteudo = readFileSync(arquivo, 'utf-8');

      const registrar = (trecho: string) =>
        infratores.push(`${arquivo.replace(SRC, 'src')}: ${trecho.slice(0, 90).replace(/\s+/g, ' ')}`);

      // (a) cor inline no próprio JSX do botão
      for (const trecho of conteudo.match(/<Button[\s\S]{0,600}?>/g) ?? []) {
        if (COR_DE_ACAO.test(trecho)) registrar(trecho);
      }

      // (b) cor numa variável de estilo que depois vai para um botão. Sem este ramo o guard-rail
      // não pegaria o próprio caso que motivou a task: o `ConfirmDialog` montava `confirmSx` numa
      // const e só então passava ao `<Button>`. Verificado por contrafactual — com apenas o ramo
      // (a), reintroduzir o drift deixava o teste verde.
      for (const trecho of conteudo.match(/const \w*[Ss]x\b[\s\S]{0,300}?;/g) ?? []) {
        if (COR_DE_ACAO.test(trecho)) registrar(trecho);
      }
    }

    expect(infratores, `use PRIMARY/SUCCESS/DANGER/GHOST_BTN_SX:\n${infratores.join('\n')}`).toEqual([]);
  });
});
