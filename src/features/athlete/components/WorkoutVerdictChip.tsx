import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { semantic } from '../../../theme/tokens';
import { radius } from '../../../shared/design-tokens/density';
import type { WorkoutVerdictView } from '../adapters/buildWorkoutAnalysisView';

export interface WorkoutVerdictChipProps {
    verdict: WorkoutVerdictView;
}

const TONE_COLOR = {
    success: semantic.success[500],
    warning: semantic.warning[500],
} as const;

/**
 * Chip de veredito de aderência ao plano — ponto + rótulo, cor só de `semantic.success`/`warning`
 * (add-athlete-workout-verdict-chip, D4). Presentacional: o front só pinta o que recebe, nunca
 * recalcula limiar — rótulo e tom já vêm resolvidos de `buildWorkoutAnalysisView`.
 */
export function WorkoutVerdictChip({ verdict }: WorkoutVerdictChipProps) {
    const color = TONE_COLOR[verdict.tone];
    return (
        <Box
            data-testid="workout-verdict-chip"
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: radius.xs,
                fontSize: 11,
                lineHeight: '14px',
                fontWeight: 600,
                color,
                bgcolor: alpha(color, 0.12),
                whiteSpace: 'nowrap',
            }}
        >
            <Box component="span" sx={{ width: 6, height: 6, borderRadius: radius.full, bgcolor: color }} />
            <Box component="span">{verdict.label}</Box>
        </Box>
    );
}

export default WorkoutVerdictChip;
