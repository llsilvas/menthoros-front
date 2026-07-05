import { useCallback, useState } from 'react';
import { FitUploadService } from '../api/services/FitUploadService';
import type { TreinoRealizadoDto } from '../types/TreinoManual';

export const useFitUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [result, setResult] = useState<TreinoRealizadoDto | null>(null);

    const upload = useCallback(async (arquivo: File): Promise<TreinoRealizadoDto> => {
        setUploading(true);
        setError(null);
        try {
            const treino = await FitUploadService.importar(arquivo);
            setResult(treino);
            return treino;
        } catch (err) {
            const erro = err instanceof Error ? err : new Error('Erro ao importar arquivo .fit');
            setError(erro);
            throw erro;
        } finally {
            setUploading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return { upload, uploading, error, result, reset };
};
