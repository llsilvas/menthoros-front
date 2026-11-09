import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toBlob } from 'html-to-image';
import { buildShareCardData } from '../../adapters/buildShareCardData';
import { TrajetoShareConsentService } from '../../../../api/services/TrajetoShareConsentService';
import { POLITICA_VERSAO } from '../../../../pages/waitlist/politicaPrivacidadeConteudo';
import { normalizarFoto } from '../../utils/normalizarFoto';
import type { TreinoRealizadoDto } from '../../../../types/TreinoManual';
import { ShareWorkoutView } from './ShareWorkoutView';

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));
vi.mock('../../../../api/services/TrajetoShareConsentService');
vi.mock('../../utils/normalizarFoto', () => ({ normalizarFoto: vi.fn() }));

const realizado: TreinoRealizadoDto = {
  id: 'r1', dataTreino: '2026-11-07', tipoTreino: 'CONTINUO', duracaoMin: '1:05:12', distanciaKm: 14.2,
  fonteDados: { value: 'GARMIN', label: 'Garmin' }, deviceName: 'Forerunner 265',
  status: { value: 'REALIZADO', label: 'Realizado' }, fcMedia: 148, temTrajeto: true,
};
// Polyline de referência do Google: três pontos reais.
const gpsTrace = { v: 1, n: 3, polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', tSeg: [0, 1, 2], fc: [null, null, null] };
const comMapa = buildShareCardData({ realizado, planejado: null, recentes: [realizado], assessoriaNome: 'Pace Forte', gpsTrace });

let router: ReturnType<typeof createHashRouter> | null = null;
function renderView(data = comMapa) {
  router = createHashRouter([{ path: '/', element: <ShareWorkoutView data={data} /> }]);
  return render(<RouterProvider router={router} />);
}
const consentimento = (granted: boolean) =>
  vi.mocked(TrajetoShareConsentService.obter).mockResolvedValue({ granted, policyVersion: POLITICA_VERSAO } as never);

describe('modelos com mapa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toBlob).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  });
  afterEach(() => router?.dispose());

  it('sem trajeto, Rota e Foto não aparecem no seletor (CA2)', () => {
    const semGps = buildShareCardData({ realizado: { ...realizado, temTrajeto: false }, planejado: null, recentes: [], assessoriaNome: null });
    renderView(semGps);
    expect(screen.queryByRole('radio', { name: 'Rota' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Foto' })).toBeNull();
    expect(TrajetoShareConsentService.obter).not.toHaveBeenCalled();
  });

  it('Rota: trajeto, km e atribuição Garmin (CA1)', async () => {
    consentimento(true);
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Rota' }));
    const card = screen.getByRole('img', { name: /Card Rota: trajeto de 14,2 km/ });
    expect(within(card).getByTestId('route-trace').querySelector('path')).not.toBeNull();
    expect(within(card).getByText('GARMIN FORERUNNER 265')).toBeInTheDocument();
  });

  it('treino com GPS abre na Rota; sem consentimento Salvar abre o aviso e nenhum PNG é capturado (CA6)', async () => {
    consentimento(false);
    renderView();
    expect(screen.getByRole('radio', { name: 'Rota' })).toBeChecked();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('dialog', { name: 'Seu trajeto vai aparecer na imagem' })).toBeInTheDocument();
    expect(toBlob).not.toHaveBeenCalled();
  });

  it('trocar de modelo sem mapa para Rota sem consentimento não captura a Rota', async () => {
    consentimento(false);
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Semana' }));
    await waitFor(() => expect(toBlob).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('radio', { name: 'Rota' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());
    expect(toBlob).toHaveBeenCalledTimes(1);
  });

  it('"Usar modelo sem mapa" troca para um modelo sem trajeto', async () => {
    consentimento(false);
    renderView();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await userEvent.click(screen.getByRole('button', { name: 'Usar modelo sem mapa' }));

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked());
  });

  it('confirmar concede com a versão apresentada e libera a imagem da Rota', async () => {
    consentimento(false);
    vi.mocked(TrajetoShareConsentService.conceder).mockResolvedValue({ granted: true, policyVersion: POLITICA_VERSAO } as never);
    renderView();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await userEvent.click(screen.getByRole('button', { name: 'Entendi, compartilhar' }));

    expect(TrajetoShareConsentService.conceder).toHaveBeenCalledWith(POLITICA_VERSAO);
    await waitFor(() => expect(toBlob).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled());
  });

  it('Foto: sem foto não gera imagem; escolher foto mostra os adesivos (CA7)', async () => {
    consentimento(true);
    vi.mocked(normalizarFoto).mockResolvedValue('data:image/jpeg;base64,AAAA');
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Foto' }));
    expect(screen.getByText(/Escolha uma foto abaixo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await userEvent.upload(screen.getByTestId('input-foto'), new File(['x'], 'corrida.jpg', { type: 'image/jpeg' }));

    expect(await screen.findByRole('button', { name: /Adesivo distância/ })).toBeInTheDocument();
    expect(normalizarFoto).toHaveBeenCalled();
  });

  it('Foto: adesivo se move pelo teclado', async () => {
    consentimento(true);
    vi.mocked(normalizarFoto).mockResolvedValue('data:image/jpeg;base64,AAAA');
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Foto' }));
    await userEvent.upload(screen.getByTestId('input-foto'), new File(['x'], 'corrida.jpg', { type: 'image/jpeg' }));
    const adesivo = await screen.findByRole('button', { name: /Adesivo trajeto: 52% da esquerda, 4% do topo/ });

    adesivo.focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('button', { name: /Adesivo trajeto: 52% da esquerda, 6% do topo/ })).toBeInTheDocument();
  });

  it('Foto: falha ao preparar a foto mostra erro', async () => {
    consentimento(true);
    vi.mocked(normalizarFoto).mockRejectedValue(new Error('decode'));
    renderView();
    await userEvent.click(screen.getByRole('radio', { name: 'Foto' }));
    await userEvent.upload(screen.getByTestId('input-foto'), new File(['x'], 'quebrada.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText('Não deu para usar esta foto — tente outra.')).toBeInTheDocument();
  });
});
