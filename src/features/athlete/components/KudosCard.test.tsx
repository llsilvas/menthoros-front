import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KudosCard } from './KudosCard';
import type { KudosRecente } from '../../../types/Kudos';

function kudo(id: string, motivo: KudosRecente['motivo']): KudosRecente {
  return { id, motivo, createdAt: '2026-07-04T12:00:00Z' };
}

describe('KudosCard', () => {
  it('renderiza nada quando não há kudos (estado vazio honesto)', () => {
    const { container } = render(<KudosCard kudos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza a mensagem para cada kudo (1 a 3)', () => {
    render(<KudosCard kudos={[kudo('k1', 'CONSISTENCIA'), kudo('k2', 'ESFORCO')]} />);

    expect(screen.getByText('Seu coach reconheceu sua consistência!')).toBeInTheDocument();
    expect(screen.getByText('Seu coach reconheceu sua esforço!')).toBeInTheDocument();
  });

  it('limita a exibição aos 3 mais recentes quando há mais', () => {
    render(
      <KudosCard
        kudos={[
          kudo('k1', 'CONSISTENCIA'),
          kudo('k2', 'MELHORA'),
          kudo('k3', 'ESFORCO'),
          kudo('k4', 'SUPERACAO'),
        ]}
      />,
    );

    expect(screen.getByText('Seu coach reconheceu sua consistência!')).toBeInTheDocument();
    expect(screen.getByText('Seu coach reconheceu sua melhora!')).toBeInTheDocument();
    expect(screen.getByText('Seu coach reconheceu sua esforço!')).toBeInTheDocument();
    expect(screen.queryByText('Seu coach reconheceu sua superação!')).toBeNull();
  });
});
