import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricTile } from './MetricTile';

describe('MetricTile', () => {
  it('mostra rótulo e valor', () => {
    render(<MetricTile label="Carga aguda" value="120 km" />);

    expect(screen.getByText('Carga aguda')).toBeInTheDocument();
    expect(screen.getByText('120 km')).toBeInTheDocument();
  });

  describe('diferenciação não-cor', () => {
    /**
     * O estado de uma métrica não pode existir **só** na cor do número. Cerca de 8% dos homens têm
     * alguma deficiência de visão de cores; para eles, "120 km" em âmbar e "120 km" em verde são o
     * mesmo pixel. O valor sozinho não diz se está bom ou ruim — quem diz é o tone.
     */
    it('estado de atenção é anunciado por texto, não só por cor', () => {
      render(<MetricTile label="Carga aguda" value="120 km" tone="warning" />);

      expect(screen.getByRole('img', { name: /atenção/i })).toBeInTheDocument();
    });

    it('estado crítico é anunciado por texto', () => {
      render(<MetricTile label="Monotonia" value="2.4" tone="danger" />);

      expect(screen.getByRole('img', { name: /crítico/i })).toBeInTheDocument();
    });

    it('estado bom é anunciado por texto', () => {
      render(<MetricTile label="Recuperação" value="88%" tone="success" />);

      expect(screen.getByRole('img', { name: /adequado/i })).toBeInTheDocument();
    });

    /** Métrica neutra não ganha marcador: ruído visual sem informação é pior que nada. */
    it('sem tone, não há marcador de estado', () => {
      render(<MetricTile label="Atletas exibidos" value="10" />);

      expect(screen.queryByRole('img', { name: /atenção|crítico|adequado/i })).not.toBeInTheDocument();
    });
  });
});
