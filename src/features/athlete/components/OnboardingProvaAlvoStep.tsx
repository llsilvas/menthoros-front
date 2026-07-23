import { Box, TextField } from '@mui/material';
import type { OnboardingConclusaoInput } from '../../../types/Onboarding';
import { TIPO_PROVA_LABELS, DISTANCIA_PROVA_LABELS } from '../../../types/Prova';
import type { TipoProva, DistanciaProva } from '../../../types/Prova';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const TIPOS = Object.keys(TIPO_PROVA_LABELS) as TipoProva[];
const DISTANCIAS = Object.keys(DISTANCIA_PROVA_LABELS) as DistanciaProva[];

export interface OnboardingProvaAlvoStepProps {
    value: Partial<OnboardingConclusaoInput>;
    onChange: (patch: Partial<OnboardingConclusaoInput>) => void;
}

/** Etapa final — prova alvo (CA13, cria/atualiza uma Prova real ao concluir o onboarding). */
export function OnboardingProvaAlvoStep({ value, onChange }: OnboardingProvaAlvoStepProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <OnboardingSectionLabel>Data da prova alvo</OnboardingSectionLabel>
                <TextField
                    type="date"
                    label="Data da prova"
                    value={value.dataProva ?? ''}
                    onChange={(e) => onChange({ dataProva: e.target.value })}
                    fullWidth
                    inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                    sx={onboardingInputSx}
                />
            </Box>

            <OnboardingChipGroup
                label="Tipo da prova"
                options={TIPOS}
                labels={TIPO_PROVA_LABELS}
                selected={value.tipoProva}
                onSelect={(v) => onChange({ tipoProva: v })}
            />

            <OnboardingChipGroup
                label="Distância"
                options={DISTANCIAS}
                labels={DISTANCIA_PROVA_LABELS}
                selected={value.distancia}
                onSelect={(v) => onChange({ distancia: v })}
            />

            <Box>
                <OnboardingSectionLabel>Nome da prova (opcional)</OnboardingSectionLabel>
                <TextField
                    label="Nome da prova"
                    placeholder="Ex.: Maratona Internacional de São Paulo"
                    value={value.nomeProva ?? ''}
                    onChange={(e) => onChange({ nomeProva: e.target.value.slice(0, 200) })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>
        </Box>
    );
}
