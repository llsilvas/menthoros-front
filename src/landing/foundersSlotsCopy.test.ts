import { describe, it, expect } from 'vitest';
import { foundersSlotsLabel } from './foundersSlotsCopy';

const labels = {
  baseLabel: 'Programa fundador',
  openLabel: 'Programa fundador · Restam {remaining} de {total} vagas',
  closedLabel: 'Lista de espera — próxima turma',
};

describe('foundersSlotsLabel', () => {
  it('carregando: sem número', () => {
    expect(foundersSlotsLabel({ data: null, loading: true, error: false }, labels)).toBe('Programa fundador');
  });

  it('falha: sem número, mesmo texto do carregando', () => {
    expect(foundersSlotsLabel({ data: null, loading: false, error: true }, labels)).toBe('Programa fundador');
  });

  it('vagas abertas: Restam N de T', () => {
    const data = { total: 10, taken: 3, remaining: 7, open: true };
    expect(foundersSlotsLabel({ data, loading: false, error: false }, labels)).toBe(
      'Programa fundador · Restam 7 de 10 vagas',
    );
  });

  it('vagas esgotadas: texto de lista de espera', () => {
    const data = { total: 10, taken: 10, remaining: 0, open: false };
    expect(foundersSlotsLabel({ data, loading: false, error: false }, labels)).toBe('Lista de espera — próxima turma');
  });
});
