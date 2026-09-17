import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MelhoresEsforcosPanel } from './MelhoresEsforcosPanel';
import type { MelhorEsforcoDto } from '../../../types/AtletaPerfilCoach';

const CINCO_K: MelhorEsforcoDto = {
  distanciaLabel: '5k', distanciaMetros: 5000, tempoSegundos: 1796, paceLabel: '5:59/km',
};
const DEZ_K: MelhorEsforcoDto = {
  distanciaLabel: '10k', distanciaMetros: 10000, tempoSegundos: 3619, paceLabel: '6:02/km',
};

describe('MelhoresEsforcosPanel', () => {
  it('estado vazio quando não há marcas (sem integração ou sem dado)', () => {
    render(<MelhoresEsforcosPanel marcas={[]} />);
    expect(screen.getByText(/nenhum esforço/i)).toBeInTheDocument();
  });

  it('mostra distância, tempo formatado e pace de cada marca', () => {
    render(<MelhoresEsforcosPanel marcas={[CINCO_K, DEZ_K]} />);

    expect(screen.getByText('5k')).toBeInTheDocument();
    expect(screen.getByText('29:56')).toBeInTheDocument();
    expect(screen.getByText('5:59/km')).toBeInTheDocument();

    expect(screen.getByText('10k')).toBeInTheDocument();
    expect(screen.getByText('1:00:19')).toBeInTheDocument();
    expect(screen.getByText('6:02/km')).toBeInTheDocument();
  });
});
