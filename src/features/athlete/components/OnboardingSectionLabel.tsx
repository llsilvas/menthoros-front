import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { surface } from '../../../theme/tokens';

interface OnboardingSectionLabelProps {
    children: ReactNode;
    /** Marca a pergunta como opcional, sempre com o mesmo sufixo — antes cada etapa escrevia de um jeito ("(opcional)", "— opcional", ou nada). */
    optional?: boolean;
    /** Uma linha de ajuda abaixo da pergunta, para o leigo saber por que respondê-la. */
    hint?: string;
}

export function OnboardingSectionLabel({ children, optional = false, hint }: OnboardingSectionLabelProps) {
    return (
        <Box>
            <Typography sx={{ color: surface[50], fontSize: '0.875rem', fontWeight: 600 }}>
                {children}
                {optional && (
                    <Typography component="span" sx={{ color: surface[500], fontSize: '0.8rem', fontWeight: 400, ml: 0.75 }}>
                        (opcional)
                    </Typography>
                )}
            </Typography>
            {hint && (
                <Typography sx={{ color: surface[400], fontSize: '0.78rem', mt: 0.25, lineHeight: 1.4 }}>
                    {hint}
                </Typography>
            )}
        </Box>
    );
}
