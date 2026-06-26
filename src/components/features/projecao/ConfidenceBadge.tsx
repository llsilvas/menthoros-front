import React from 'react';
import { Chip } from '@mui/material';
import type { ProjectionConfidence } from '../../../types/RaceProjection';
import { CONFIDENCE_LABELS } from '../../../types/RaceProjection';
import { semantic } from '../../../theme/tokens';

interface ConfidenceBadgeProps {
    confidence: ProjectionConfidence;
    size?: 'small' | 'medium';
}

// Confiança mapeada às zonas semânticas: baixa→danger, média→warning, alta→success.
const CONFIDENCE_STYLES: Record<ProjectionConfidence, { bg: string; color: string; border: string }> = {
    LOW: {
        bg: `${semantic.danger[500]}1F`,
        color: semantic.danger[300],
        border: `${semantic.danger[500]}4D`,
    },
    MEDIUM: {
        bg: `${semantic.warning[500]}1F`,
        color: semantic.warning[400],
        border: `${semantic.warning[500]}4D`,
    },
    HIGH: {
        bg: `${semantic.success[500]}1F`,
        color: semantic.success[500],
        border: `${semantic.success[500]}4D`,
    },
};

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, size = 'small' }) => {
    const style = CONFIDENCE_STYLES[confidence];
    return (
        <Chip
            label={`Confiança ${CONFIDENCE_LABELS[confidence]}`}
            size={size}
            sx={{
                bgcolor: style.bg,
                color: style.color,
                fontWeight: 700,
                border: `1px solid ${style.border}`,
                fontSize: size === 'small' ? '0.72rem' : '0.8rem',
            }}
        />
    );
};

export default ConfidenceBadge;
