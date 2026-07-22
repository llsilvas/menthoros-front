import { Box, Chip, TextField } from '@mui/material';
import type { OnboardingDraftInput } from '../../../types/Onboarding';
import { DIA_SEMANA_LABELS } from '../../../types/Atleta';
import type { diaSemana } from '../../../types/Atleta';
import { onboardingChipSx, onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';

const DIAS = Object.keys(DIA_SEMANA_LABELS) as diaSemana[];
const PERCEPCOES = ['RUIM', 'REGULAR', 'BOA', 'OTIMA'] as const;
const PERCEPCAO_LABELS: Record<(typeof PERCEPCOES)[number], string> = {
    RUIM: 'Ruim', REGULAR: 'Regular', BOA: 'Boa', OTIMA: 'Ótima',
};

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
            <Box>
                <OnboardingSectionLabel>Dias disponíveis para treino</OnboardingSectionLabel>
                <Box role="group" aria-label="Dias disponíveis" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {DIAS.map((d) => (
                        <Chip
                            key={d}
                            label={DIA_SEMANA_LABELS[d]}
                            onClick={() => toggleDia(d)}
                            role="checkbox"
                            aria-checked={diasSelecionados.includes(d)}
                            sx={onboardingChipSx(diasSelecionados.includes(d))}
                        />
                    ))}
                </Box>
            </Box>

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

            <Box>
                <OnboardingSectionLabel>Como você percebe seu condicionamento atual?</OnboardingSectionLabel>
                <Box role="radiogroup" aria-label="Percepção de condicionamento" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {PERCEPCOES.map((p) => (
                        <Chip
                            key={p}
                            label={PERCEPCAO_LABELS[p]}
                            onClick={() => onChange({ percepcaoCondicionamento: p })}
                            role="radio"
                            aria-checked={draft.percepcaoCondicionamento === p}
                            sx={onboardingChipSx(draft.percepcaoCondicionamento === p)}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
