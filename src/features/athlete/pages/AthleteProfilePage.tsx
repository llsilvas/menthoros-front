import { Box, Typography } from '@mui/material';
import { Person as ProfileIcon } from '@mui/icons-material';
import { primary, surface } from '../../../theme/tokens';
import { elevation } from '../../../shared/design-tokens';
import { IntervalsIcuConnectionCard } from '../components/IntervalsIcuConnectionCard';
import { LogoutButton } from '../../../shared/components/LogoutButton';

// Layout previsto: dados do perfil do atleta, metas, configurações de notificação
// Nota na tela de Configurações: "Tema claro chegará em breve" (spec dark-first)
export default function AthleteProfilePage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: elevation.base, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ProfileIcon sx={{ color: primary[500], fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: surface[50] }}>
            Perfil
          </Typography>
          <Typography variant="body2" sx={{ color: surface[400] }}>
            Seus dados e configurações
          </Typography>
        </Box>
      </Box>

      <IntervalsIcuConnectionCard />

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${surface[700]}`, borderRadius: 1 }}>
        <Typography sx={{ color: surface[500], fontSize: '0.9rem' }}>
          Em construção — dados do atleta, metas e preferências
        </Typography>
      </Box>

      {/*
        Sair fica aqui, e não na navegação inferior: a bottom nav carrega os cinco destinos do
        atleta, e sair não é um destino. Perfil é onde se procura ação de conta — e ficar ao fim da
        página, separado por divisória, reduz a chance de toque acidental no celular.
      */}
      <Box sx={{ borderTop: `1px solid ${surface[800]}`, pt: 1.5 }}>
        <LogoutButton />
      </Box>
    </Box>
  );
}
