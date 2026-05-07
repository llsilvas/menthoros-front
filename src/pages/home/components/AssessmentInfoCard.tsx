import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import {
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useUserInfo } from '../../../hooks/useUserInfo';
import { glassSx, glassSxHover, transitions } from '../../../theme/tokens';

export default function AssessmentInfoCard() {
  const userInfo = useUserInfo();

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      treinador: 'Treinador',
      atleta: 'Atleta',
      admin: 'Administrador',
      assessor: 'Assessor',
    };
    return roleMap[role.toLowerCase()] || role;
  };

  const primaryRole = userInfo.roles?.[0] ? getRoleLabel(userInfo.roles[0]) : 'Usuário';

  return (
    <Paper
      sx={{
        p: 2.5,
        transition: transitions.default,
        ...glassSx,
        '&:hover': glassSxHover,
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <BusinessCenterIcon sx={{ fontSize: 24, color: '#b1e92d' }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#ffffff',
                fontSize: '0.95rem',
              }}
            >
              {userInfo.organizationName || 'Assessoria'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
              }}
            >
              Sua Assessoria
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(100, 150, 200, 0.1)',
            border: '1px solid rgba(100, 150, 200, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: '#a4d9ff' }} />
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              Seu Perfil
            </Typography>
          </Box>

          <Stack spacing={1} sx={{ pl: 3.5 }}>
            {userInfo.name && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Nome
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    mt: 0.25,
                  }}
                >
                  {userInfo.name}
                </Typography>
              </Box>
            )}

            <Chip
              label={primaryRole}
              size="small"
              sx={{
                bgcolor: 'rgba(177, 233, 45, 0.2)',
                color: '#b1e92d',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />

            {userInfo.email && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Email
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#a4d9ff',
                    mt: 0.25,
                    wordBreak: 'break-all',
                  }}
                >
                  {userInfo.email}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
