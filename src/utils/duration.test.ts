import { describe, expect, it } from 'vitest';
import { formatDuracaoEsforco } from './duration';

describe('formatDuracaoEsforco', () => {
  it('sob 1 hora: "mm:ss", sem zero à esquerda no minuto', () => {
    expect(formatDuracaoEsforco(1796)).toBe('29:56');
    expect(formatDuracaoEsforco(272)).toBe('4:32');
  });

  it('1 hora ou mais: "h:mm:ss", minuto com zero à esquerda', () => {
    expect(formatDuracaoEsforco(3619)).toBe('1:00:19');
  });
});
