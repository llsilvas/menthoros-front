import { describe, it, expect } from 'vitest';
import { calcularStreakSemanas } from './streakAdapter';

// Referência fixa: quarta-feira, 2026-07-01 (semana ISO 2026-06-29 a 2026-07-05).
const HOJE = new Date('2026-07-01T12:00:00');

function treino(dataTreino: string) {
  return { dataTreino };
}

describe('streakAdapter', () => {
  describe('calcularStreakSemanas', () => {
    it('sem treino nenhum → streak 0', () => {
      expect(calcularStreakSemanas([], HOJE)).toBe(0);
    });

    it('streak ativo: treino nas 3 semanas consecutivas até a atual', () => {
      const treinos = [
        treino('2026-07-01'), // semana atual
        treino('2026-06-25'), // semana passada
        treino('2026-06-18'), // 2 semanas atrás
      ];

      expect(calcularStreakSemanas(treinos, HOJE)).toBe(3);
    });

    it('streak quebrado por lacuna: não conta além da semana sem treino', () => {
      const treinos = [
        treino('2026-07-01'), // semana atual
        treino('2026-06-25'), // semana passada
        // lacuna: sem treino em 2026-06-18 (2 semanas atrás)
        treino('2026-06-11'), // 3 semanas atrás — não deve contar, lacuna interrompe
      ];

      expect(calcularStreakSemanas(treinos, HOJE)).toBe(2);
    });

    it('semana atual em andamento sem treino ainda: conta a partir da semana anterior', () => {
      const treinos = [
        treino('2026-06-25'), // semana passada
        treino('2026-06-18'), // 2 semanas atrás
        // nada ainda na semana atual (2026-06-29 a 2026-07-05) — dá benefício da dúvida
      ];

      expect(calcularStreakSemanas(treinos, HOJE)).toBe(2);
    });

    it('semana atual sem treino E semana anterior também sem treino → streak 0', () => {
      const treinos = [
        treino('2026-06-18'), // 2 semanas atrás — não ajuda, há lacuna logo antes da atual
      ];

      expect(calcularStreakSemanas(treinos, HOJE)).toBe(0);
    });
  });
});
