import { Box, Chip, TextField } from '@mui/material';
import type { OnboardingDraftInput, CanalIntegracao, DispositivoMarca } from '../../../types/Onboarding';
import { CANAL_INTEGRACAO_LABELS, DISPOSITIVO_MARCA_LABELS } from '../../../types/Onboarding';
import { NIVEL_EXPERIENCIA_LABELS } from '../../../types/Atleta';
import type { nivelExperiencia } from '../../../types/Atleta';
import { onboardingChipSx, onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';

const NIVEIS = Object.keys(NIVEL_EXPERIENCIA_LABELS) as nivelExperiencia[];
const CANAIS = Object.keys(CANAL_INTEGRACAO_LABELS) as CanalIntegracao[];
const DISPOSITIVOS = Object.keys(DISPOSITIVO_MARCA_LABELS) as DispositivoMarca[];

export interface OnboardingPerfilStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/**
 * Etapa 1 — nível de experiência, dispositivo (marca + modelo opcional) e canal de integração.
 * Strava não é oferecido como opção de canal para atletas novos (ADR-0003, descontinuação
 * anunciada) — só INTERVALS_ICU e MANUAL aparecem.
 */
export function OnboardingPerfilStep({ draft, onChange }: OnboardingPerfilStepProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <OnboardingSectionLabel>Nível de experiência</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Nível de experiência" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {NIVEIS.map((n) => (
                        <Chip
                            key={n}
                            label={NIVEL_EXPERIENCIA_LABELS[n]}
                            onClick={() => onChange({ nivelExperiencia: n })}
                            role="radio"
                            aria-checked={draft.nivelExperiencia === n}
                            sx={onboardingChipSx(draft.nivelExperiencia === n)}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <OnboardingSectionLabel>Marca do dispositivo/relógio</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Marca do dispositivo" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {DISPOSITIVOS.map((d) => (
                        <Chip
                            key={d}
                            label={DISPOSITIVO_MARCA_LABELS[d]}
                            onClick={() => onChange({ dispositivoMarca: d })}
                            role="radio"
                            aria-checked={draft.dispositivoMarca === d}
                            sx={onboardingChipSx(draft.dispositivoMarca === d)}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <OnboardingSectionLabel>Modelo do dispositivo (opcional)</OnboardingSectionLabel>
                <TextField
                    label="Modelo"
                    placeholder="Ex.: Forerunner 265"
                    value={draft.dispositivoModelo ?? ''}
                    onChange={(e) => onChange({ dispositivoModelo: e.target.value })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>

            <Box>
                <OnboardingSectionLabel>Canal de integração de treinos</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Canal de integração" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {CANAIS.map((c) => (
                        <Chip
                            key={c}
                            label={CANAL_INTEGRACAO_LABELS[c]}
                            onClick={() => onChange({ canalIntegracao: c })}
                            role="radio"
                            aria-checked={draft.canalIntegracao === c}
                            sx={onboardingChipSx(draft.canalIntegracao === c)}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
