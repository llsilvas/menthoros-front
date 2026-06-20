import { useCallback, useEffect, useState } from 'react';
import { CoachAthleteProfileService } from '../api/services/CoachAthleteProfileService';
import { ApiError } from '../api/core/ApiError';
import type { AtletaPerfilCoachDto } from '../types/AtletaPerfilCoach';

export const useAthleteProfile = (atletaId: string | undefined) => {
    const [profile, setProfile] = useState<AtletaPerfilCoachDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!atletaId) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await CoachAthleteProfileService.getProfile(atletaId);
            setProfile(data);
        } catch (err) {
            if (err instanceof ApiError && (err.status === 504 || err.status === 408)) {
                setError(new Error('timeout'));
            } else {
                setError(err instanceof Error ? err : new Error('Erro ao buscar perfil do atleta'));
            }
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [atletaId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, isLoading, error, fetchProfile };
};
