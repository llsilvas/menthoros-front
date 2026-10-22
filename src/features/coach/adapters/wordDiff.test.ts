import { describe, expect, it } from 'vitest';
import { wordDiff } from './wordDiff';

describe('wordDiff', () => {
  it('textos idênticos: só tokens inalterados', () => {
    expect(wordDiff('reduzir volume', 'reduzir volume')).toEqual([
      { type: 'same', text: 'reduzir' },
      { type: 'same', text: 'volume' },
    ]);
  });

  it('inserção no fim', () => {
    expect(wordDiff('Reduzir volume', 'Reduzir volume hoje')).toEqual([
      { type: 'same', text: 'Reduzir' },
      { type: 'same', text: 'volume' },
      { type: 'added', text: 'hoje' },
    ]);
  });

  it('remoção no meio', () => {
    expect(wordDiff('a b c', 'a c')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('substituição: remove o antigo e adiciona o novo', () => {
    const diff = wordDiff('manter 20%', 'manter 30%');
    expect(diff).toContainEqual({ type: 'removed', text: '20%' });
    expect(diff).toContainEqual({ type: 'added', text: '30%' });
    expect(diff?.[0]).toEqual({ type: 'same', text: 'manter' });
  });

  it('acima de 200 palavras em qualquer lado: null (fallback sem destaque)', () => {
    const longo = Array.from({ length: 201 }, (_, i) => `w${i}`).join(' ');
    expect(wordDiff(longo, 'curto')).toBeNull();
    expect(wordDiff('curto', longo)).toBeNull();
    expect(wordDiff(Array(200).fill('w').join(' '), 'w')).not.toBeNull();
  });
});
