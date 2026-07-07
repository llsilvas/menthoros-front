import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { semantic, surface } from '../../../theme/tokens';
import { decouplingLeitura, decouplingTone, type DecouplingTone } from './decouplingReading';

const TONE_TOKEN: Record<DecouplingTone, string> = {
    success: semantic.success[500],
    warning: semantic.warning[500],
    danger: semantic.danger[500],
};

const TOOLTIP_NUMERO =
    'Queda do fator de eficiência (velocidade/FC) da 1ª para a 2ª metade. Menor é melhor. ' +
    'Estimativa em treino contínuo — pode refletir terreno/vento/calor, não só fadiga.';
const TOOLTIP_ND = 'Disponível só em treinos contínuos com dados suficientes.';

interface DecouplingBadgeProps {
    value: number | null | undefined;
}

const DecouplingBadge: React.FC<DecouplingBadgeProps> = ({ value }) => {
    // null e undefined tratados de forma idêntica (a API omite o campo quando não aplicável).
    if (value == null) {
        return (
            <Tooltip title={TOOLTIP_ND} enterDelay={0}>
                <Chip
                    label="Decoupling: n/d"
                    size="small"
                    sx={{
                        bgcolor: `${surface[500]}1F`,
                        color: surface[400],
                        fontWeight: 600,
                        border: `1px solid ${surface[500]}4D`,
                        fontSize: '0.72rem',
                    }}
                />
            </Tooltip>
        );
    }

    const tone = decouplingTone(value);
    const token = TONE_TOKEN[tone];

    return (
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.25, alignItems: 'flex-start' }}>
            <Tooltip title={TOOLTIP_NUMERO} enterDelay={0}>
                <Chip
                    label={`Decoupling ${value.toFixed(1)}%`}
                    size="small"
                    sx={{
                        bgcolor: `${token}1F`,
                        color: token,
                        fontWeight: 700,
                        border: `1px solid ${token}4D`,
                        fontSize: '0.72rem',
                    }}
                />
            </Tooltip>
            <Typography variant="caption" sx={{ color: surface[400], fontSize: '0.68rem' }}>
                {decouplingLeitura(value)}
            </Typography>
        </Box>
    );
};

export default DecouplingBadge;
