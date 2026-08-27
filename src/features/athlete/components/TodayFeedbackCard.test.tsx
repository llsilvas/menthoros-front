import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayFeedbackCard } from './TodayFeedbackCard';
import type { AthleteRealizadoHoje } from '../../../types/AthleteHome';

const REALIZADO: AthleteRealizadoHoje = {
  id: 'r1', fonteDados: 'INTERVALS_ICU', tipoTreino: 'INTERVALADO', duracaoMin: 45, distanciaKm: 8,
};

function renderCard(props: Partial<React.ComponentProps<typeof TodayFeedbackCard>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<TodayFeedbackCard realizado={REALIZADO} onSubmit={onSubmit} {...props} />);
  return { onSubmit };
}

describe('TodayFeedbackCard', () => {
  it('mostra os dados do feito com origem', () => {
    renderCard();
    expect(screen.getByText(/intervalado/i)).toBeInTheDocument();
    expect(screen.getByText(/intervals\.icu/i)).toBeInTheDocument();
  });

  it('dez alvos de RPE 1–10, um único selecionável por vez', async () => {
    renderCard();
    const alvos = screen.getAllByRole('radio', { name: /^\d+$/ });
    expect(alvos).toHaveLength(10);
    await userEvent.click(alvos[5]); // "6"
    expect(alvos[5]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(alvos[7]); // "8"
    expect(alvos[7]).toHaveAttribute('aria-checked', 'true');
    expect(alvos[5]).toHaveAttribute('aria-checked', 'false');
  });

  it('chips de sensação são multi-seleção', async () => {
    renderCard();
    const dor = screen.getByRole('checkbox', { name: /^dor$/i });
    const calor = screen.getByRole('checkbox', { name: /calor/i });
    await userEvent.click(dor);
    await userEvent.click(calor);
    expect(dor).toHaveAttribute('aria-checked', 'true');
    expect(calor).toHaveAttribute('aria-checked', 'true');
  });

  it('envio desabilitado até escolher o RPE; um envio com RPE, sensações e frase', async () => {
    const { onSubmit } = renderCard();
    const enviar = screen.getByRole('button', { name: /enviar/i });
    expect(enviar).toBeDisabled();

    await userEvent.click(screen.getByRole('radio', { name: '6' }));
    await userEvent.click(screen.getByRole('checkbox', { name: /pernas pesadas/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^dor$/i }));
    await userEvent.type(screen.getByRole('textbox'), 'Difícil no final');
    expect(enviar).toBeEnabled();
    await userEvent.click(enviar);

    expect(onSubmit).toHaveBeenCalledWith({
      percepcaoEsforco: 6,
      sensacoes: ['PERNAS_PESADAS', 'DOR'],
      comentario: 'Difícil no final',
    });
  });

  it('pré-preenche com o RPE existente quando o realizado já tem percepcaoEsforco', () => {
    renderCard({ realizado: { ...REALIZADO, percepcaoEsforco: 7 } });
    expect(screen.getByRole('radio', { name: '7' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: /enviar/i })).toBeEnabled();
  });

  it('mostra o erro quando passado', () => {
    renderCard({ error: 'Não foi possível salvar. Tente novamente.' });
    expect(screen.getByText(/não foi possível salvar/i)).toBeInTheDocument();
  });
});
