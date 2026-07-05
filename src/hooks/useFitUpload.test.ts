import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFitUpload } from './useFitUpload';
import { FitUploadService } from '../api/services/FitUploadService';
import type { TreinoRealizadoDto } from '../types/TreinoManual';

vi.mock('../api/services/FitUploadService');

const STUB_DTO: TreinoRealizadoDto = {
    id: 'uuid-fit-1',
    dataTreino: '2026-07-01',
    tipoTreino: 'CONTINUO',
    duracaoMin: '00:30:00',
    distanciaKm: 5,
    fcMedia: 150,
    tssCalculado: 62,
    fonteDados: { value: 'MANUAL', label: 'Manual' },
    status: { value: 'REALIZADO', label: 'Realizado' },
    etapasRealizadas: [{}, {}],
};

function arquivoFit(): File {
    return new File(['dados binários simulados'], 'treino.fit', { type: 'application/octet-stream' });
}

describe('useFitUpload', () => {
    beforeEach(() => vi.clearAllMocks());

    it('importa o arquivo e popula result', async () => {
        vi.mocked(FitUploadService.importar).mockResolvedValue(STUB_DTO);

        const { result } = renderHook(() => useFitUpload());
        let treino!: TreinoRealizadoDto;
        await act(async () => { treino = await result.current.upload(arquivoFit()); });

        expect(treino.id).toBe('uuid-fit-1');
        expect(FitUploadService.importar).toHaveBeenCalledWith(expect.any(File));
        expect(result.current.result).toEqual(STUB_DTO);
        expect(result.current.uploading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('popula error e propaga a exceção quando o import falha', async () => {
        vi.mocked(FitUploadService.importar).mockRejectedValue(new Error('422'));

        const { result } = renderHook(() => useFitUpload());
        await act(async () => {
            await expect(result.current.upload(arquivoFit())).rejects.toThrow('422');
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.uploading).toBe(false);
        expect(result.current.result).toBeNull();
    });

    it('reset limpa result e error', async () => {
        vi.mocked(FitUploadService.importar).mockResolvedValue(STUB_DTO);

        const { result } = renderHook(() => useFitUpload());
        await act(async () => { await result.current.upload(arquivoFit()); });
        expect(result.current.result).not.toBeNull();

        act(() => { result.current.reset(); });

        expect(result.current.result).toBeNull();
        expect(result.current.error).toBeNull();
    });
});
