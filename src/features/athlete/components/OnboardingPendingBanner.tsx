import { Alert, AlertTitle, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { ROUTES } from '../../../constants/routes';

/**
 * Entrada do onboarding na Home do atleta. Até aqui não havia caminho: nem redirecionamento no
 * login nem link — só a rota do coach ou digitar a URL. Não bloqueia o uso do app; convida.
 */
export function OnboardingPendingBanner() {
    return (
        <Alert
            severity="info"
            data-testid="onboarding-pending-banner"
            action={
                <Button component={RouterLink} to={ROUTES.ATHLETE_ONBOARDING} color="inherit" size="small" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Completar
                </Button>
            }
        >
            <AlertTitle>Complete seu perfil</AlertTitle>
            Cinco perguntas rápidas para o seu treinador montar um plano do seu tamanho.
        </Alert>
    );
}
