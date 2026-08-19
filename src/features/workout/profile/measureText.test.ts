import { describe, it, expect } from 'vitest';
import { medirTexto, fontCss } from './measureText';

// O setup do Vitest desativa o canvas, então estes testes exercitam o caminho
// de fallback — que é justamente o que precisa de trava, por ser um número
// calibrado à mão contra medição no navegador.
const FONTE = fontCss(600, '0.625rem', '"Inter", system-ui, sans-serif');

/** Larguras medidas no Chrome a 0.625rem/600, que originaram a calibração. */
const MEDIDO_NO_NAVEGADOR: Array<[string, number]> = [
  ['AQUECIMENTO', 80],
  ['DESAQUECIMENTO', 99],
  ['PRINCIPAL', 57],
  ['DESAQ', 35],
];

describe('medirTexto — o fallback não pode ser otimista', () => {
  // A versão anterior estimava 6px por caractere e escolhia um rótulo que não
  // cabia: num bloco de 100px ela dizia que "DESAQUECIMENTO" (99px reais) cabia
  // com folga. Errar para o lado da abreviação é barato; errar para o lado de
  // decepar o rótulo é o defeito que o AC-7 existe para impedir.
  it.each(MEDIDO_NO_NAVEGADOR)('a estimativa de "%s" cobre os %spx reais', (texto, real) => {
    expect(medirTexto(texto, FONTE)).toBeGreaterThanOrEqual(real);
  });

  // Pessimista demais também custa: some rótulo que caberia. A folga fica
  // limitada a 30% do valor real.
  it.each(MEDIDO_NO_NAVEGADOR)('a estimativa de "%s" não exagera', (texto, real) => {
    expect(medirTexto(texto, FONTE)).toBeLessThanOrEqual(real * 1.3);
  });

  it('cresce com o comprimento do texto', () => {
    expect(medirTexto('AAAA', FONTE)).toBeGreaterThan(medirTexto('AA', FONTE));
  });

  it('texto vazio não ocupa espaço', () => {
    expect(medirTexto('', FONTE)).toBe(0);
  });
});

describe('fontCss', () => {
  it('monta no formato que o canvas espera', () => {
    expect(fontCss(600, '0.625rem', 'Inter')).toBe('600 0.625rem Inter');
  });
});
