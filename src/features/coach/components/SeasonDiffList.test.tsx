import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SeasonDiffList } from './SeasonDiffList';

describe('SeasonDiffList', () => {
  it('sem alterações diz que o ajuste é igual à versão ativa', () => {
    render(<SeasonDiffList diff={[]} baseVersion={1} />);

    expect(screen.getByText('Nenhuma alteração em relação à versão 1.')).toBeInTheDocument();
  });

  it('lista cada campo alterado com antes, depois e origem', () => {
    render(<SeasonDiffList baseVersion={1} diff={[
      { weekIndex: 5, field: 'longRunKm', before: 18, after: 20, source: 'COACH' },
      { weekIndex: 7, field: 'phase', before: 'BASE', after: 'BUILD', source: 'ENGINE' },
    ]} />);

    const itens = within(screen.getByRole('list', { name: 'Alterações' })).getAllByRole('listitem');
    expect(itens[0]).toHaveTextContent('Semana 5 · Longão: 18,0 km → 20,0 km (treinador)');
    expect(itens[1]).toHaveTextContent('Semana 7 · Fase: Base → Construção (motor)');
  });

  it('erro ao carregar o diff vira aviso', () => {
    render(<SeasonDiffList diff={[]} baseVersion={1} error="Erro ao carregar as alterações" />);

    expect(screen.getByText('Erro ao carregar as alterações')).toBeInTheDocument();
  });
});
