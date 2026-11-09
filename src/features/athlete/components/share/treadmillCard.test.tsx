import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toBlob } from 'html-to-image';
import { buildShareCardData } from '../../adapters/buildShareCardData';
import { TrajetoShareConsentService } from '../../../../api/services/TrajetoShareConsentService';
import { normalizarFoto } from '../../utils/normalizarFoto';
import type { TreinoRealizadoDto } from '../../../../types/TreinoManual';
import { ShareWorkoutView } from './ShareWorkoutView';
import { TreadmillCard } from './TreadmillCard';

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));
vi.mock('../../../../api/services/TrajetoShareConsentService');
vi.mock('../../utils/normalizarFoto', () => ({ normalizarFoto: vi.fn() }));

// Forma real de `GET /me/treinos` com o flag de add-activity-treadmill-flag.
const esteira: TreinoRealizadoDto = {
  id: 'e1', dataTreino: '2026-11-08', tipoTreino: 'CONTINUO', duracaoMin: '50:30', distanciaKm: 10,
  fonteDados: { value: 'GARMIN', label: 'Garmin' }, deviceName: 'Forerunner 265',
  status: { value: 'REALIZADO', label: 'Realizado' }, fcMedia: 146, tssCalculado: 58, esteira: true,
};
const dados = (over: Partial<TreinoRealizadoDto> = {}) =>
  buildShareCardData({ realizado: { ...esteira, ...over }, planejado: null, recentes: [esteira], assessoriaNome: 'Pace Forte' });

describe('TreadmillCard', () => {
  it('selo, km, pace, atribuição Garmin e os três blocos (CA1)', () => {
    render(<TreadmillCard view={dados().esteira!} mostrarFc />);
    expect(screen.getByTestId('selo-esteira')).toHaveTextContent('ESTEIRA');
    expect(screen.getByText('10,0')).toBeInTheDocument();
    expect(screen.getByText('5:03')).toBeInTheDocument();
    expect(screen.getByText('GARMIN FORERUNNER 265')).toBeInTheDocument();
    expect(screen.getByText('50:30')).toBeInTheDocument();
    expect(screen.getByText('146')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
  });

  it('sem distância: o destaque é o tempo e o pace some; sem TSS e FC os blocos somem (CA2)', () => {
    render(<TreadmillCard view={dados({ distanciaKm: undefined, tssCalculado: undefined, fcMedia: undefined }).esteira!} mostrarFc />);
    expect(screen.queryByText('KM')).toBeNull();
    expect(screen.queryByText('/KM')).toBeNull();
    expect(screen.queryByText('TSS')).toBeNull();
    expect(screen.queryByText('FC MÉD')).toBeNull();
    expect(screen.getByText('TEMPO')).toBeInTheDocument();
  });

  it('Mostrar FC desligado esconde o bloco de FC (CA3)', () => {
    render(<TreadmillCard view={dados().esteira!} mostrarFc={false} />);
    expect(screen.queryByText('FC MÉD')).toBeNull();
    expect(screen.getByText('TSS')).toBeInTheDocument();
  });

  it('fonte manual: sem atribuição Garmin (CA4)', () => {
    render(<TreadmillCard view={dados({ fonteDados: { value: 'MANUAL', label: 'Manual' }, deviceName: null }).esteira!} mostrarFc />);
    expect(screen.queryByTestId('garmin-attribution')).toBeNull();
  });
});

describe('ShareWorkoutView — modelo Esteira', () => {
  let router: ReturnType<typeof createHashRouter> | null = null;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toBlob).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  });
  afterEach(() => router?.dispose());

  function renderView(data = dados()) {
    router = createHashRouter([{ path: '/', element: <ShareWorkoutView data={data} /> }]);
    return render(<RouterProvider router={router} />);
  }

  it('picker lista "Esteira"; escolher muda para story e desenha o card (CA1)', async () => {
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Esteira' }));
    expect(screen.getByRole('radio', { name: 'Story 9:16' })).toBeChecked();
    expect(screen.getByRole('img', { name: /Card Esteira: 10,0 km/ })).toBeInTheDocument();
    expect(screen.getByTestId('selo-esteira')).toBeInTheDocument();
  });

  it('esteira false: a opção não aparece (CA1)', () => {
    renderView(dados({ esteira: false }));
    expect(screen.queryByRole('radio', { name: 'Esteira' })).toBeNull();
  });

  it('alternar "Mostrar FC" regenera a imagem no modelo Esteira (CA3)', async () => {
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Esteira' }));
    await waitFor(() => expect(toBlob).toHaveBeenCalled());
    const antes = vi.mocked(toBlob).mock.calls.length;
    await userEvent.click(screen.getByRole('switch', { name: 'Mostrar FC' }));
    await waitFor(() => expect(vi.mocked(toBlob).mock.calls.length).toBeGreaterThan(antes));
    expect(screen.queryByText('FC MÉD')).toBeNull();
  });

  it('Foto na esteira: sem consentimento de trajeto; a foto mostra o selo no lugar do trajeto (CA7)', async () => {
    vi.mocked(normalizarFoto).mockResolvedValue('data:image/jpeg;base64,AAAA');
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Foto' }));
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    await userEvent.upload(screen.getByTestId('input-foto'), new File(['x'], 'esteira.jpg', { type: 'image/jpeg' }));

    const adesivo = await screen.findByRole('button', { name: /Adesivo esteira/ });
    expect(adesivo).toContainElement(screen.getByTestId('selo-esteira'));
    expect(screen.queryByRole('button', { name: /Adesivo trajeto/ })).toBeNull();
    expect(TrajetoShareConsentService.obter).not.toHaveBeenCalled();
    await waitFor(() => expect(toBlob).toHaveBeenCalled());
  });
});
