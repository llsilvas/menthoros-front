import { Box, Typography, Chip } from '@mui/material';
import { useUserInfo } from '../../../hooks/useUserInfo';

export default function AssessmentHeader() {
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {userInfo.organizationName && (
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#b1e92d',
              letterSpacing: '0.5px',
            }}
          >
            {userInfo.organizationName}
          </Typography>
        )}

        {userInfo.name && (
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {userInfo.name}
          </Typography>
        )}
      </Box>

      <Chip
        label={primaryRole}
        size="small"
        sx={{
          bgcolor: 'rgba(177, 233, 45, 0.15)',
          color: '#b1e92d',
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
        }}
      />
    </Box>
  );
}
