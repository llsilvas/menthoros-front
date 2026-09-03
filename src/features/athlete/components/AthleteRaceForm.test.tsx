import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AthleteRaceForm, type AthleteRaceFormProps } from './AthleteRaceForm';

const HOJE = new Date(2026, 8, 2); // 2 de setembro

function renderForm(props: Partial<AthleteRaceFormProps> = {}) {
  const onSubmit = vi.fn();
  render(
    <AthleteRaceForm submitting={false} submitLabel="Cadastrar prova" onSubmit={onSubmit} onCancel={vi.fn()} hoje={HOJE} {...props} />,
  );
  return { onSubmit };
}

async function preencheMaratona(data: string) {
  await userEvent.type(screen.getByLabelText(/nome da prova/i), 'Maratona SP');
  fireEvent.change(screen.getByTestId('race-date'), { target: { value: data } });
  await userEvent.click(screen.getByRole('radio', { name: '42 km' }));
}

describe('AthleteRaceForm', () => {
  it('maratona em 8 semanas mostra "Preparação curta" e ainda deixa cadastrar', async () => {
    const { onSubmit } = renderForm();
    await preencheMaratona('2026-10-28');

    const regra = screen.getByTestId('race-rule');
    expect(regra).toHaveTextContent('Preparação curta');
    expect(regra).toHaveTextContent('42 km pede 16 semanas de preparação. Faltam 8');
    expect(regra).toHaveTextContent(/cadastrar mesmo assim e seu treinador será avisado/i);

    await userEvent.click(screen.getByRole('button', { name: /cadastrar prova/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      nomeProva: 'Maratona SP', dataProva: '2026-10-28', tipoProva: 'MARATONA', distancia: 'KM_42',
      distanciaKm: undefined, tempoObjetivo: undefined, provaAlvo: false,
    });
  });

  it('maratona em 20 semanas mostra "Dentro do recomendado"', async () => {
    renderForm();
    await preencheMaratona('2027-01-20');

    const regra = screen.getByTestId('race-rule');
    expect(regra).toHaveTextContent('Dentro do recomendado');
    expect(regra).toHaveTextContent('Faltam 20.');
  });

  it('"Outra" de 30 km usa a faixa de 21 km e deriva TRAIL pelo terreno', async () => {
    const { onSubmit } = renderForm();
    await userEvent.type(screen.getByLabelText(/nome da prova/i), 'Trilha');
    fireEvent.change(screen.getByTestId('race-date'), { target: { value: '2027-01-20' } });
    await userEvent.click(screen.getByRole('radio', { name: 'Outra' }));
    expect(screen.getByRole('button', { name: /cadastrar prova/i })).toBeDisabled();
    fireEvent.change(screen.getByTestId('race-km'), { target: { value: '30' } });
    await userEvent.click(screen.getByRole('radio', { name: 'Trail' }));

    expect(screen.getByTestId('race-rule')).toHaveTextContent('30 km pede 12 semanas');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar prova/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tipoProva: 'TRAIL', distancia: 'CUSTOMIZADA', distanciaKm: 30 }));
  });

  it('data de hoje é recusada', async () => {
    renderForm();
    await preencheMaratona('2026-09-02');

    expect(screen.getByText(/precisa ser depois de hoje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar prova/i })).toBeDisabled();
  });

  it('marcar como alvo com alvo existente mostra o aviso de troca', async () => {
    renderForm({ existingTargetName: 'Meia do Rio' });
    expect(screen.queryByTestId('race-target-warning')).toBeNull();

    await userEvent.click(screen.getByLabelText(/prova-alvo/i));

    expect(screen.getByTestId('race-target-warning')).toHaveTextContent('Substitui Meia do Rio como sua prova-alvo. Seu treinador será avisado.');
  });

  it('o payload não leva status, resultado nem campos derivados', async () => {
    const { onSubmit } = renderForm();
    await preencheMaratona('2027-01-20');
    await userEvent.click(screen.getByRole('button', { name: /cadastrar prova/i }));

    const payload = onSubmit.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(['dataProva', 'distancia', 'distanciaKm', 'nomeProva', 'provaAlvo', 'tempoObjetivo', 'tipoProva']);
  });
});
