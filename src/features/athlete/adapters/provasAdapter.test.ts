import { describe, it, expect } from 'vitest';
import { buildProximaProva } from './provasAdapter';
import type { Prova } from '../../../types/Prova';

const HOJE = new Date('2026-07-01T12:00:00');

function prova(overrides: Partial<Prova> = {}): Prova {
  return {
    id: '1', nomeProva: 'Prova Teste', dataProva: '2026-07-01', tipoProva: 'CORRIDA_RUA', distancia: 'KM_10',
    ...overrides,
  };
}

describe('provasAdapter', () => {
  describe('buildProximaProva', () => {
    it('retorna null quando não há provas', () => {
      expect(buildProximaProva([], HOJE)).toBeNull();
    });

    it('retorna null quando só há provas passadas', () => {
      const provas = [prova({ dataProva: '2026-06-01', diasFaltando: -30 })];
      expect(buildProximaProva(provas, HOJE)).toBeNull();
    });

    it('retorna a prova futura mais próxima (nome + diasFaltando do DTO, sem recalcular)', () => {
      const provas = [
        prova({ nomeProva: 'Maratona de SP', dataProva: '2026-08-18', diasFaltando: 48 }),
        prova({ nomeProva: '10k do Parque', dataProva: '2026-07-15', diasFaltando: 14 }),
      ];

      expect(buildProximaProva(provas, HOJE)).toEqual({ nomeProva: '10k do Parque', diasFaltando: 14 });
    });

    it('inclui prova no próprio dia de hoje (data >= hoje)', () => {
      const provas = [prova({ nomeProva: 'Prova de Hoje', dataProva: '2026-07-01', diasFaltando: 0 })];
      expect(buildProximaProva(provas, HOJE)).toEqual({ nomeProva: 'Prova de Hoje', diasFaltando: 0 });
    });

    it('ignora provas passadas ao escolher a mais próxima entre passadas e futuras', () => {
      const provas = [
        prova({ nomeProva: 'Prova Passada', dataProva: '2026-06-20', diasFaltando: -11 }),
        prova({ nomeProva: 'Prova Futura', dataProva: '2026-07-20', diasFaltando: 19 }),
      ];

      expect(buildProximaProva(provas, HOJE)).toEqual({ nomeProva: 'Prova Futura', diasFaltando: 19 });
    });

    it('não fabrica diasFaltando=0 quando o DTO não traz o campo (undefined, não 0)', () => {
      const provas = [prova({ nomeProva: 'Prova Sem Contagem', dataProva: '2026-07-20', diasFaltando: undefined })];

      const resultado = buildProximaProva(provas, HOJE);
      expect(resultado?.nomeProva).toBe('Prova Sem Contagem');
      expect(resultado?.diasFaltando).toBeUndefined();
    });
  });
});
