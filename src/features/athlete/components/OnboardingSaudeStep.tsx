import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput } from '../../../types/Onboarding';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const SIM_NAO_OPTIONS = ['sim', 'nao'] as const;
const SIM_NAO_LABELS: Record<(typeof SIM_NAO_OPTIONS)[number], string> = { sim: 'Sim', nao: 'Não' };

export interface OnboardingSaudeStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/**
 * Passo 3 — saúde. Tudo opcional: quem não tem nada a declarar pula. Campos de detalhe só
 * aparecem quando `temLesao` é sim (CA12 — dado sensível, visível ao próprio atleta e a
 * TECNICO/ADMIN do mesmo tenant).
 */
export function OnboardingSaudeStep({ draft, onChange }: OnboardingSaudeStepProps) {
    const temLesaoSelecionado = draft.temLesao === undefined ? undefined : (draft.temLesao ? 'sim' : 'nao');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Você está com alguma lesão ou dor agora?"
                optional
                hint="Seu treinador usa isso para não prescrever o que pode piorar."
                options={SIM_NAO_OPTIONS}
                labels={SIM_NAO_LABELS}
                selected={temLesaoSelecionado}
                onSelect={(v) => onChange(
                    v === 'sim'
                        ? { temLesao: true }
                        : { temLesao: false, descricaoLesao: undefined, dataUltimaLesao: undefined }
                )}
            />

            {draft.temLesao && (
                <>
                    <Box>
                        <OnboardingSectionLabel>Onde e o quê?</OnboardingSectionLabel>
                        <TextField
                            multiline
                            rows={2}
                            label="Descrição"
                            placeholder="Ex.: Dor no joelho direito ao descer escada"
                            value={draft.descricaoLesao ?? ''}
                            onChange={(e) => onChange({ descricaoLesao: e.target.value.slice(0, 1000) })}
                            fullWidth
                            helperText={`${(draft.descricaoLesao ?? '').length}/1000`}
                            sx={onboardingInputSx}
                        />
                    </Box>

                    <Box>
                        <OnboardingSectionLabel optional>Desde quando?</OnboardingSectionLabel>
                        <TextField
                            type="date"
                            label="Data aproximada"
                            value={draft.dataUltimaLesao ?? ''}
                            onChange={(e) => onChange({ dataUltimaLesao: e.target.value || undefined })}
                            fullWidth
                            inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                            // Campo de data nativo mostra "mm/dd/yyyy" mesmo vazio; sem `shrink` o
                            // rótulo fica desenhado por cima desse placeholder.
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={onboardingInputSx}
                        />
                    </Box>
                </>
            )}

            <Box>
                <OnboardingSectionLabel optional hint="Mesmo já recuperadas — ajuda a prevenir que voltem.">
                    Teve lesões importantes no passado?
                </OnboardingSectionLabel>
                <TextField
                    multiline
                    rows={2}
                    label="Histórico"
                    placeholder="Ex.: Canelite em 2024, fascite em 2023"
                    value={draft.historicoLesoes ?? ''}
                    onChange={(e) => onChange({ historicoLesoes: e.target.value.slice(0, 5000) })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>
        </Box>
    );
}
