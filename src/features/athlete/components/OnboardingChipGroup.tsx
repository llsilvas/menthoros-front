import { Box, Chip } from '@mui/material';
import { onboardingChipSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';

export interface OnboardingChipGroupProps<T extends string> {
    label: string;
    options: readonly T[];
    labels: Record<T, string>;
    /** Valor único (single-select, `role="radiogroup"`) ou array (multi-select, `role="group"`). */
    selected: T | T[] | undefined;
    onSelect: (value: T) => void;
    /** `true` para seleção múltipla (checkbox) — default `false` (radio, single-select). */
    multi?: boolean;
}

/**
 * Grupo de Chip usado como radiogroup (single-select) ou checkbox group (multi-select) —
 * extraído (correção QA 2026-07-22, achado do clean-code-reviewer) para eliminar a duplicação
 * estrutural de `role`/`aria-checked`/`.map` repetida em quase todas as etapas do onboarding.
 */
export function OnboardingChipGroup<T extends string>({
    label, options, labels, selected, onSelect, multi = false,
}: OnboardingChipGroupProps<T>) {
    const isSelected = (opt: T) => (multi ? Array.isArray(selected) && selected.includes(opt) : selected === opt);

    return (
        <Box>
            <OnboardingSectionLabel>{label}</OnboardingSectionLabel>
            <Box
                role={multi ? 'group' : 'radiogroup'}
                aria-label={label}
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
            >
                {options.map((opt) => (
                    <Chip
                        key={opt}
                        label={labels[opt]}
                        onClick={() => onSelect(opt)}
                        role={multi ? 'checkbox' : 'radio'}
                        aria-checked={isSelected(opt)}
                        sx={onboardingChipSx(isSelected(opt))}
                    />
                ))}
            </Box>
        </Box>
    );
}
