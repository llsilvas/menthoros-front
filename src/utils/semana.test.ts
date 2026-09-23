import { describe, expect, it } from 'vitest';
import { ORDEM_DIAS, indiceDoDia, isoDoDiaNaSemana, weekDatesFromInicio } from './semana';

/**
 * Fonte única de dias da semana (show-descanso-no-plano, /qa): o mesmo array estava reescrito em
 * três arquivos do diff, e um typo em "SABADO" num deles desalinharia a tela do treinador da do
 * atleta sem quebrar o build.
 */
describe('utils/semana', () => {
  const semana = weekDatesFromInicio('2026-09-21'); // segunda

  it('a ordem canônica começa na segunda e termina no domingo', () => {
    expect(ORDEM_DIAS[0]).toBe('SEGUNDA');
    expect(ORDEM_DIAS[6]).toBe('DOMINGO');
    expect(ORDEM_DIAS).toHaveLength(7);
  });

  it.each([
    ['SEGUNDA', 0],
    ['quinta', 3],
    ['  SABADO ', 5],
    ['DOMINGO', 6],
  ])('indiceDoDia(%s) = %i, tolerando caixa e espaços', (dia, esperado) => {
    expect(indiceDoDia(dia)).toBe(esperado);
  });

  it.each([[undefined], [null], [''], ['FUNDAY']])('indiceDoDia(%s) = -1', (dia) => {
    expect(indiceDoDia(dia as never)).toBe(-1);
  });

  it('isoDoDiaNaSemana devolve a data daquele dia dentro da semana do plano', () => {
    expect(isoDoDiaNaSemana(semana, 'QUINTA')).toBe('2026-09-24');
    expect(isoDoDiaNaSemana(semana, 'SEGUNDA')).toBe('2026-09-21');
    expect(isoDoDiaNaSemana(semana, 'DOMINGO')).toBe('2026-09-27');
  });

  it('dia desconhecido cai na segunda — nunca devolve data inválida', () => {
    expect(isoDoDiaNaSemana(semana, 'FUNDAY')).toBe('2026-09-21');
  });

  it('weekDatesFromInicio gera 7 dias consecutivos em horário local', () => {
    expect(semana).toHaveLength(7);
    expect(semana[0].getDate()).toBe(21);
    expect(semana[6].getDate()).toBe(27);
  });
});
