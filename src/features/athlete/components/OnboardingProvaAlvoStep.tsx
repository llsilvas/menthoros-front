import { Box, Chip, TextField } from '@mui/material';
import type { OnboardingConclusaoInput } from '../../../types/Onboarding';
import { TIPO_PROVA_LABELS, DISTANCIA_PROVA_LABELS } from '../../../types/Prova';
import type { TipoProva, DistanciaProva } from '../../../types/Prova';
import { onboardingChipSx, onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';

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

            <Box>
                <OnboardingSectionLabel>Tipo da prova</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Tipo da prova" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {TIPOS.map((t) => (
                        <Chip
                            key={t}
                            label={TIPO_PROVA_LABELS[t]}
                            onClick={() => onChange({ tipoProva: t })}
                            role="radio"
                            aria-checked={value.tipoProva === t}
                            sx={onboardingChipSx(value.tipoProva === t)}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <OnboardingSectionLabel>Distância</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Distância" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {DISTANCIAS.map((d) => (
                        <Chip
                            key={d}
                            label={DISTANCIA_PROVA_LABELS[d]}
                            onClick={() => onChange({ distancia: d })}
                            role="radio"
                            aria-checked={value.distancia === d}
                            sx={onboardingChipSx(value.distancia === d)}
                        />
                    ))}
                </Box>
            </Box>

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
