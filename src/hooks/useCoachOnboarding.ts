import { useCallback, useState } from 'react';
import { AtletasService } from '../api/services/AtletasService';
import { CoachOnboardingService } from '../api/services/CoachOnboardingService';
import type { CriarAtletaMinimo } from '../types/CoachOnboarding';

/**
 * Ações do wizard de boas-vindas.
 *
 * Guarda o `atletaId` criado nesta execução — é ele que habilita a etapa de convite. Um refresh
 * perde esse id (o `POST /api/v1/atletas` não aceita chave de idempotência), e nesse caso o convite
 * fica para a tela de atletas; persistir estado do wizard entre sessões está fora do escopo.
 */
export function useCoachOnboarding() {
    const [atletaId, setAtletaId] = useState<string | null>(null);
    const [conviteEnviado, setConviteEnviado] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const criarAtleta = useCallback(async (dados: CriarAtletaMinimo) => {
        setSalvando(true);
        setErro(null);
        try {
            const atleta = await CoachOnboardingService.criarPrimeiroAtleta(dados);
            setAtletaId(atleta.id);
            return true;
        } catch (err) {
            // A unicidade de e-mail é GLOBAL, não por tenant: o conflito pode ser com um atleta de
            // outra assessoria. Dizer "já está na sua assessoria" seria falso e mandaria o coach
            // procurar numa lista onde ele não está.
            setErro(ehConflito(err)
                ? 'Já existe um atleta cadastrado com estes dados.'
                : 'Não foi possível cadastrar o atleta. Tente de novo.');
            return false;
        } finally {
            setSalvando(false);
        }
    }, []);

    const convidar = useCallback(async () => {
        if (!atletaId || conviteEnviado) return false;
        setSalvando(true);
        setErro(null);
        try {
            // O convite é operação de atleta, não do wizard — mora no AtletasService.
            await AtletasService.convidarAtleta(atletaId);
            // Trava o reenvio: o endpoint reenvia a cada chamada e o atleta receberia dois e-mails.
            setConviteEnviado(true);
            return true;
        } catch {
            setErro('Não foi possível enviar o convite. Você pode convidar depois, na tela de atletas.');
            return false;
        } finally {
            setSalvando(false);
        }
    }, [atletaId, conviteEnviado]);

    const concluir = useCallback(async () => {
        setSalvando(true);
        setErro(null);
        try {
            await CoachOnboardingService.concluir();
            return true;
        } catch {
            setErro('Não foi possível concluir. Tente de novo.');
            return false;
        } finally {
            setSalvando(false);
        }
    }, []);

    return { atletaId, conviteEnviado, salvando, erro, criarAtleta, convidar, concluir };
}

function ehConflito(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'status' in err
        && (err as { status?: number }).status === 409;
}
