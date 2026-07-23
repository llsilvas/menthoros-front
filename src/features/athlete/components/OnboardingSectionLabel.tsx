import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';

export function OnboardingSectionLabel({ children }: { children: ReactNode }) {
    return (
        <Typography sx={{ color: surface[50], fontSize: '0.875rem', fontWeight: 600 }}>
            {children}
        </Typography>
    );
}
