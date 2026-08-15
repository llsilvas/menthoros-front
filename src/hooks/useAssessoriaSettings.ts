import { useCallback, useState } from 'react';
import { AssessoriaSettingsService } from '../api/services/AssessoriaSettingsService';
import type { AssessoriaMe } from '../types/AssessoriaSettings';

/**
 * Estado da configuração da assessoria.
 *
 * Segue o padrão dos demais hooks do módulo: não dispara sozinho — quem chama `carregar()` é o
 * componente, num `useEffect`.
 *
 * **Toda escrita devolve a assessoria já atualizada**, com a `version` nova, e o hook a guarda no
 * estado. Isso evita o erro clássico deste contrato: salvar duas vezes seguidas com a versão
 * antiga e tomar 409 na segunda por culpa do próprio cliente.
 */
export function useAssessoriaSettings() {
    const [assessoria, setAssessoria] = useState<AssessoriaMe | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<Error | null>(null);
    const [salvando, setSalvando] = useState(false);
    /** Sinaliza edição concorrente: a UI oferece recarregar sem descartar o rascunho. */
    const [conflito, setConflito] = useState(false);

    const carregar = useCallback(async () => {
        try {
            setCarregando(true);
            setErro(null);
            setAssessoria(await AssessoriaSettingsService.buscarMinhaAssessoria());
        } catch (err) {
            setErro(err instanceof Error ? err : new Error('Falha ao carregar a assessoria'));
        } finally {
            setCarregando(false);
        }
    }, []);

    /** Executa uma escrita tratando 409 como conflito, não como erro genérico. */
    const escrever = useCallback(async (operacao: () => Promise<AssessoriaMe | void>) => {
        setSalvando(true);
        setErro(null);
        setConflito(false);
        try {
            const atualizada = await operacao();
            if (atualizada) {
                setAssessoria(atualizada);
            } else {
                // DELETE não devolve corpo: recarrega para obter a versão nova.
                setAssessoria(await AssessoriaSettingsService.buscarMinhaAssessoria());
            }
            return true;
        } catch (err) {
            if (ehConflito(err)) {
                setConflito(true);
            } else {
                setErro(err instanceof Error ? err : new Error('Falha ao salvar'));
            }
            return false;
        } finally {
            setSalvando(false);
        }
    }, []);

    const salvarNome = useCallback(
        (nome: string, version: number) =>
            escrever(() => AssessoriaSettingsService.atualizar({ nome, version })),
        [escrever],
    );

    const enviarLogo = useCallback(
        (arquivo: File, version: number) =>
            escrever(() => AssessoriaSettingsService.enviarLogo(arquivo, version)),
        [escrever],
    );

    const removerLogo = useCallback(
        (version: number) => escrever(() => AssessoriaSettingsService.removerLogo(version)),
        [escrever],
    );

    return {
        assessoria,
        carregando,
        erro,
        salvando,
        conflito,
        carregar,
        salvarNome,
        enviarLogo,
        removerLogo,
    };
}

/** O 409 vem do `ApiError` do cliente gerado, que expõe `status`. */
function ehConflito(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'status' in err
        && (err as { status?: number }).status === 409;
}
