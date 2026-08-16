import { useCallback, useState } from 'react';
import { CoachOnboardingService } from '../api/services/CoachOnboardingService';

/**
 * Ações do wizard de boas-vindas.
 *
 * Só a conclusão mora aqui. O wizard já criou atleta e disparou convite; ambos saíram por decisão
 * de UX — cadastro de atleta acontece na tela de Atletas, com formulário completo e convite —, e
 * com eles saíram os estados que este hook guardava.
 */
export function useCoachOnboarding() {
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

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

    return { salvando, erro, concluir };
}
