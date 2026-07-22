import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput } from '../../../types/Onboarding';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';

export interface OnboardingObjetivoStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/** Etapa 2 — objetivo do atleta com o treinamento e modalidade principal. */
export function OnboardingObjetivoStep({ draft, onChange }: OnboardingObjetivoStepProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <OnboardingSectionLabel>Qual é o seu objetivo com o treinamento?</OnboardingSectionLabel>
                <TextField
                    multiline
                    rows={3}
                    label="Objetivo"
                    placeholder="Ex.: Completar minha primeira maratona em menos de 4 horas"
                    value={draft.objetivo ?? ''}
                    onChange={(e) => onChange({ objetivo: e.target.value.slice(0, 500) })}
                    fullWidth
                    helperText={`${(draft.objetivo ?? '').length}/500`}
                    sx={onboardingInputSx}
                />
            </Box>

            <Box>
                <OnboardingSectionLabel>Modalidade principal</OnboardingSectionLabel>
                <TextField
                    label="Modalidade"
                    placeholder="Ex.: Corrida"
                    value={draft.modalidade ?? ''}
                    onChange={(e) => onChange({ modalidade: e.target.value.slice(0, 30) })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>
        </Box>
    );
}
