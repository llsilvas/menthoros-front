import React from 'react';
import { Chip } from '@mui/material';
import type { ProjectionConfidence } from '../../../types/RaceProjection';
import { CONFIDENCE_LABELS } from '../../../types/RaceProjection';

interface ConfidenceBadgeProps {
    confidence: ProjectionConfidence;
    size?: 'small' | 'medium';
}

const CONFIDENCE_STYLES: Record<ProjectionConfidence, { bg: string; color: string; border: string }> = {
    LOW: {
        bg: 'rgba(231, 76, 60, 0.12)',
        color: '#c0392b',
        border: 'rgba(231, 76, 60, 0.3)',
    },
    MEDIUM: {
        bg: 'rgba(243, 156, 18, 0.12)',
        color: '#b7770d',
        border: 'rgba(243, 156, 18, 0.3)',
    },
    HIGH: {
        bg: 'rgba(39, 174, 96, 0.12)',
        color: '#1e8449',
        border: 'rgba(39, 174, 96, 0.3)',
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
