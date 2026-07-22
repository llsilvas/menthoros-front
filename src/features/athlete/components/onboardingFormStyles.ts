import { primary, surface, content } from '../../../theme/tokens';

/** Estilo compartilhado dos TextField entre as etapas do onboarding (mesmo padrão de ManualTrainingForm). */
export const onboardingInputSx = {
    mt: 0.5,
    '& .MuiOutlinedInput-root': {
        color: surface[50],
        bgcolor: content.inputBg,
        '& fieldset': { borderColor: content.inputBorder },
        '&:hover fieldset': { borderColor: content.inputBorderFocus },
        '&.Mui-focused fieldset': { borderColor: primary[500] },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            display: 'none',
        },
    },
    '& .MuiInputLabel-root': { color: surface[400] },
    '& .MuiInputLabel-root.Mui-focused': { color: primary[500] },
    '& .MuiFormHelperText-root': { color: surface[500] },
};

/** Estilo compartilhado do Chip usado como radio-group/multi-select entre as etapas do onboarding. */
export function onboardingChipSx(selected: boolean) {
    return {
        bgcolor: selected ? primary[500] : content.cardBg,
        color: selected ? surface[900] : surface[200],
        fontWeight: selected ? 700 : 400,
        border: `1px solid ${selected ? primary[500] : content.cardBorder}`,
        '&:hover': { bgcolor: selected ? primary[400] : content.cardBgHover },
        cursor: 'pointer',
    };
}
