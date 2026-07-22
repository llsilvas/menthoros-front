import { Box, TextField } from '@mui/material';
import type { OnboardingDraftInput, PercepcaoCondicionamento } from '../../../types/Onboarding';
import { PERCEPCAO_CONDICIONAMENTO_LABELS } from '../../../types/Onboarding';
import { DIA_SEMANA_LABELS } from '../../../types/Atleta';
import type { diaSemana } from '../../../types/Atleta';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { OnboardingChipGroup } from './OnboardingChipGroup';

const DIAS = Object.keys(DIA_SEMANA_LABELS) as diaSemana[];
const PERCEPCOES = Object.keys(PERCEPCAO_CONDICIONAMENTO_LABELS) as PercepcaoCondicionamento[];

export interface OnboardingDisponibilidadeStepProps {
    draft: OnboardingDraftInput;
    onChange: (patch: Partial<OnboardingDraftInput>) => void;
}

/** Etapa 3 — dias disponíveis, duração por sessão, volume e percepção de condicionamento atual. */
export function OnboardingDisponibilidadeStep({ draft, onChange }: OnboardingDisponibilidadeStepProps) {
    const diasSelecionados = draft.diasDisponiveis ?? [];

    const toggleDia = (dia: diaSemana) => {
        const jaSelecionado = diasSelecionados.includes(dia);
        onChange({
            diasDisponiveis: jaSelecionado
                ? diasSelecionados.filter((d) => d !== dia)
                : [...diasSelecionados, dia],
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OnboardingChipGroup
                label="Dias disponíveis para treino"
                options={DIAS}
                labels={DIA_SEMANA_LABELS}
                selected={diasSelecionados}
                onSelect={toggleDia}
                multi
            />

            <Box>
                <OnboardingSectionLabel>Duração disponível por sessão (minutos)</OnboardingSectionLabel>
                <TextField
                    type="number"
                    label="Duração (minutos)"
                    value={draft.duracaoDisponivelMin ?? ''}
                    onChange={(e) => onChange({ duracaoDisponivelMin: e.target.value === '' ? undefined : Number(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 1, max: 600 }}
                    sx={onboardingInputSx}
                />
            </Box>

            <Box>
                <OnboardingSectionLabel>Volume semanal máximo confortável (km)</OnboardingSectionLabel>
                <TextField
                    type="number"
                    label="Volume (km)"
                    value={draft.volumeSemanalMax ?? ''}
                    onChange={(e) => onChange({ volumeSemanalMax: e.target.value === '' ? undefined : Number(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 1, max: 300 }}
                    sx={onboardingInputSx}
                />
            </Box>

            <Box>
                <OnboardingSectionLabel>Maior treino recente (km) — opcional</OnboardingSectionLabel>
                <TextField
                    type="number"
                    label="Maior treino recente (km)"
                    value={draft.maiorTreinoRecenteKm ?? ''}
                    onChange={(e) => onChange({ maiorTreinoRecenteKm: e.target.value === '' ? undefined : Number(e.target.value) })}
                    fullWidth
                    inputProps={{ min: 0.1, max: 200, step: 0.1 }}
                    sx={onboardingInputSx}
                />
            </Box>

            <OnboardingChipGroup
                label="Como você percebe seu condicionamento atual?"
                options={PERCEPCOES}
                labels={PERCEPCAO_CONDICIONAMENTO_LABELS}
                selected={draft.percepcaoCondicionamento}
                onSelect={(v) => onChange({ percepcaoCondicionamento: v })}
            />
        </Box>
    );
}
