import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildShareCardData } from '../../adapters/buildShareCardData';
import type { TreinoRealizadoDto } from '../../../../types/TreinoManual';
import type { TreinoPlanejado } from '../../../../types/TreinoPlanejado';
import { ShareWorkoutView } from './ShareWorkoutView';
import { PlanVsActualCard } from './PlanVsActualCard';
import { SplitsCard } from './SplitsCard';
import { WeekCard } from './WeekCard';

// jsdom não rasteriza; a geração da imagem tem teste próprio (useShareImage.test.ts).
vi.mock('html-to-image', () => ({ toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })) }));

// Fixtures com a forma real da API (`GET /me/treinos`), passadas pelo adapter — sem MOCK_*.
const garmin: TreinoRealizadoDto = {
  id: 'r1',
  dataTreino: '2026-11-07',
  tipoTreino: 'INTERVALADO',
  duracaoMin: '50:38',
  distanciaKm: 10.4,
  fonteDados: { value: 'GARMIN', label: 'Garmin' },
  deviceName: 'Forerunner 265',
  status: { value: 'REALIZADO', label: 'Realizado' },
  fcMedia: 158,
  etapasRealizadas: [
    { ordem: 1, paceMedia: '4:22', distanciaKm: 0.8 },
    { ordem: 2, paceMedia: '4:19', distanciaKm: 0.8 },
    { ordem: 3, paceMedia: '4:14', distanciaKm: 0.8 },
  ],
};
const manual: TreinoRealizadoDto = {
  ...garmin, id: 'm1', fonteDados: { value: 'MANUAL', label: 'Manual' }, deviceName: null, etapasRealizadas: [],
};
const planejado = {
  tipoTreino: 'INTERVALADO', descricao: '6 × 800 m', distanciaKm: 10,
  etapas: [{ ordem: 1, tipoEtapa: 'AQUECIMENTO', duracaoMin: 12 }, { ordem: 2, tipoEtapa: 'ESFORCO', distanciaKm: 0.8, repeticoes: 6 }],
} as TreinoPlanejado;

const data = buildShareCardData({ realizado: garmin, planejado, recentes: [garmin], assessoriaNome: 'Assessoria Pace Forte' });

describe('PlanVsActualCard', () => {
  it('título, distância, atribuição Garmin abaixo do título e FC quando ligada (CA4)', () => {
    render(<PlanVsActualCard view={data.plano!} mostrarFc />);
    expect(screen.getByRole('heading', { name: '6 × 800 m' })).toBeInTheDocument();
    expect(screen.getByText('10,4')).toBeInTheDocument();
    expect(screen.getByText('GARMIN FORERUNNER 265')).toBeInTheDocument();
    expect(screen.getByText('FC MÉD')).toBeInTheDocument();
  });

  it('esconde a FC quando a chave está desligada', () => {
    render(<PlanVsActualCard view={data.plano!} mostrarFc={false} />);
    expect(screen.queryByText('FC MÉD')).not.toBeInTheDocument();
  });

  it('treino manual: sem atribuição Garmin (CA4)', () => {
    const d = buildShareCardData({ realizado: { ...manual, etapasRealizadas: garmin.etapasRealizadas }, planejado, recentes: [], assessoriaNome: null });
    render(<PlanVsActualCard view={d.plano!} mostrarFc />);
    expect(screen.queryByTestId('garmin-attribution')).not.toBeInTheDocument();
  });
});

describe('SplitsCard', () => {
  it('uma barra por volta, com o pace no rótulo acessível', () => {
    render(<SplitsCard view={data.parciais!} />);
    const lista = screen.getByRole('list', { name: /4:22, 4:19, 4:14/ });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('GARMIN FORERUNNER 265')).toBeInTheDocument();
  });
});

describe('WeekCard', () => {
  it('km total, sete dias e atribuição agregada (CA5)', () => {
    render(<WeekCard view={data.semana} />);
    expect(screen.getByText('10,4')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Quilômetros por dia: S descanso/ })).toBeInTheDocument();
    expect(screen.getByText('Inclui dados de dispositivo Garmin')).toBeInTheDocument();
  });

  it('semana só com treinos manuais: sem atribuição (CA5)', () => {
    const d = buildShareCardData({ realizado: manual, planejado: null, recentes: [manual], assessoriaNome: null });
    render(<WeekCard view={d.semana} />);
    expect(screen.queryByTestId('garmin-attribution')).not.toBeInTheDocument();
  });
});

describe('ShareWorkoutView', () => {
  it('abre no primeiro modelo com o formato dele; trocar de modelo troca o card (CA1)', async () => {
    render(<ShareWorkoutView data={data} />);
    expect(screen.getByRole('img', { name: /Card Plano × realizado: 6 × 800 m/ })).toHaveAttribute('data-format', 'story');

    await userEvent.click(screen.getByRole('radio', { name: 'Semana' }));

    const card = screen.getByRole('img', { name: 'Card Semana: 10,4 km em 1 treino(s)' });
    expect(card).toHaveAttribute('data-format', 'quadrado');
  });

  it('desligar "Mostrar assessoria" tira a assinatura do card (CA3)', async () => {
    render(<ShareWorkoutView data={data} />);
    expect(screen.getByTestId('share-signature')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Mostrar assessoria' }));
    expect(screen.queryByTestId('share-signature')).not.toBeInTheDocument();
  });

  it('Salvar fica disponível depois que a imagem do card é gerada (CA7)', async () => {
    render(<ShareWorkoutView data={data} />);
    expect(await screen.findByRole('button', { name: 'Salvar' })).toBeEnabled();
  });
});
