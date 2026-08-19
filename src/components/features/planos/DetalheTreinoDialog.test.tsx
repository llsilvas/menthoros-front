import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DetalheTreinoDialog from './DetalheTreinoDialog';
import type { TreinoPlanejado } from '../../../types/TreinoPlanejado';

// O diálogo busca detalhes quando o treino chega sem etapas — o caso do último
// teste. Nos demais o fixture já vem completo e a chamada não acontece.
vi.mock('../../../api/services/TreinoService', () => ({
  TreinoService: {
    obterTreino: vi.fn(() => Promise.resolve({ etapas: [] })),
    enriquecerComStrava: vi.fn(() => Promise.resolve({})),
  },
}));
vi.mock('./useDecouplingRealizado', () => ({
  useDecouplingRealizado: () => ({ decoupling: null }),
}));

const TREINO: TreinoPlanejado = {
  id: 'treino-1',
  tipoTreino: 'INTERVALADO',
  distanciaKm: 10,
  duracaoMin: 40,
  diaSemana: 'TERCA',
  dataTreino: '2026-08-18',
  tssPlanejado: 62,
  intensidadePlanejada: 0.88,
  etapas: [
    { ordem: 1, tipoEtapa: 'AQUECIMENTO',    duracaoMin: 10, fcAlvoEtapa: 'Z2' },
    { ordem: 2, tipoEtapa: 'INTERVALADO',    duracaoMin: 15, fcAlvoEtapa: 'Z4' },
    { ordem: 3, tipoEtapa: 'RECUPERACAO',    duracaoMin: 10, fcAlvoEtapa: 'Z1' },
    { ordem: 4, tipoEtapa: 'DESAQUECIMENTO', duracaoMin: 5,  fcAlvoEtapa: 'Z2' },
  ],
};

const renderizar = (treino: TreinoPlanejado = TREINO) =>
  render(<DetalheTreinoDialog open onClose={vi.fn()} treino={treino} />);

describe('DetalheTreinoDialog — AC-10: sem texto genérico na região do perfil', () => {
  // "Leitura rápida" e "Resumo estrutural" eram dois cards que diziam em prosa
  // o que o gráfico já mostra — e ocupavam o espaço que agora é das métricas.
  it('não existe mais o card "Resumo estrutural"', () => {
    renderizar();
    expect(screen.queryByText('Resumo estrutural')).toBeNull();
  });

  it('não existe mais o card "Leitura rápida" na região do perfil', () => {
    renderizar();
    const perfil = screen.getByTestId('workout-profile');
    expect(within(perfil).queryByText(/leitura rápida/i)).toBeNull();
  });

  it('o eyebrow "Timeline do treino" saiu — o perfil tem título próprio', () => {
    renderizar();
    expect(screen.queryByText('Timeline do treino')).toBeNull();
    expect(screen.queryByText('Etapas por duração e zona')).toBeNull();
    expect(within(screen.getByTestId('workout-profile')).getByText('Perfil do treino')).toBeInTheDocument();
  });

  it('o header traz duração e número de blocos como chips', () => {
    renderizar();
    const chips = within(screen.getByTestId('workout-profile')).getByTestId('header-chips');
    expect(chips).toHaveTextContent('40 min');
    expect(chips).toHaveTextContent('4 blocos');
  });
});

describe('DetalheTreinoDialog — AC-8 (parte estrutural): uma superfície, um header', () => {
  it('a região do perfil tem exatamente um elemento caixa-alta: a badge', () => {
    renderizar();
    const perfil = screen.getByTestId('workout-profile');
    expect(within(perfil).getAllByTestId('target-zone-badge')).toHaveLength(1);
  });
});

describe('DetalheTreinoDialog — o chip de zona e o gráfico não podem divergir', () => {
  // O chip do cabeçalho derivava a própria zona dominante, separado da timeline
  // e da distribuição. Agora os três leem `metrics.targetZone`.
  it('o chip do cabeçalho mostra a mesma zona da badge do perfil', () => {
    renderizar();
    const badge = screen.getByTestId('target-zone-badge');
    expect(badge).toHaveTextContent('Z4');
    // O chip fora do perfil repete a mesma zona, com o rótulo por extenso.
    expect(screen.getByText(/^Z4 • Limiar$/)).toBeInTheDocument();
  });
});

describe('DetalheTreinoDialog — treino sem etapas', () => {
  it('não renderiza o perfil quando não há etapas estruturadas', () => {
    renderizar({ ...TREINO, etapas: [] });
    expect(screen.queryByTestId('workout-profile')).toBeNull();
  });
});
