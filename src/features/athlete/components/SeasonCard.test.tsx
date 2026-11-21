import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeasonCard } from './SeasonCard';
import type { AthleteSeasonPlan } from '../../../types/SeasonPlan';

describe('SeasonCard', () => {
  it.each([[[]], [{}], [{ raceName: 'Maratona SP', raceDate: '2027-04-04' }]])(
    'resposta fora do contrato (%j) não renderiza nem quebra',
    (resposta) => {
      const { container } = render(<SeasonCard season={resposta as unknown as AthleteSeasonPlan} />);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
