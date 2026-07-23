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
 * Etapa 4 — histórico de lesões. Campos de detalhe só aparecem quando `temLesao` é sim (CA12 —
 * dado sensível, visível ao próprio atleta e a TECNICO/ADMIN do mesmo tenant).
 */
export function OnboardingSaudeStep({ draft, onChange }: OnboardingSaudeStepProps) {
    const temLesaoSelecionado = draft.temLesao === undefined ? undefined : (draft.temLesao ? 'sim' : 'nao');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Você possui alguma lesão?"
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
                        <OnboardingSectionLabel>Descrição da lesão</OnboardingSectionLabel>
                        <TextField
                            multiline
                            rows={2}
                            label="Descrição"
                            placeholder="Ex.: Tendinite no joelho direito"
                            value={draft.descricaoLesao ?? ''}
                            onChange={(e) => onChange({ descricaoLesao: e.target.value.slice(0, 1000) })}
                            fullWidth
                            helperText={`${(draft.descricaoLesao ?? '').length}/1000`}
                            sx={onboardingInputSx}
                        />
                    </Box>

                    <Box>
                        <OnboardingSectionLabel>Data da última lesão</OnboardingSectionLabel>
                        <TextField
                            type="date"
                            label="Data da última lesão"
                            value={draft.dataUltimaLesao ?? ''}
                            onChange={(e) => onChange({ dataUltimaLesao: e.target.value || undefined })}
                            fullWidth
                            inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                            sx={onboardingInputSx}
                        />
                    </Box>
                </>
            )}

            <Box>
                <OnboardingSectionLabel>Histórico de lesões (opcional)</OnboardingSectionLabel>
                <TextField
                    multiline
                    rows={3}
                    label="Histórico de lesões"
                    placeholder="Lesões anteriores relevantes, mesmo que já recuperadas"
                    value={draft.historicoLesoes ?? ''}
                    onChange={(e) => onChange({ historicoLesoes: e.target.value.slice(0, 5000) })}
                    fullWidth
                    sx={onboardingInputSx}
                />
            </Box>
        </Box>
    );
}
