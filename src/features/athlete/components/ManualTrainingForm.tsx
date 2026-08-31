import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Slider,
    TextField,
    Typography,
} from '@mui/material';
import { format, subDays } from 'date-fns';
import type { TipoTreino, TreinoManualInput, CalibracaoExtras } from '../../../types/TreinoManual';
import { TIPO_TREINO_LABELS, CALIBRACAO_EXTRAS_DEFAULT } from '../../../types/TreinoManual';
import { RPE_LABELS } from '../../../types/Rpe';
import { primary, surface, content, backgrounds } from '../../../theme/tokens';
import { onboardingInputSx } from './onboardingFormStyles';
import { OnboardingSectionLabel } from './OnboardingSectionLabel';
import { CalibrationExtrasFields } from './CalibrationExtrasFields';

const TIPOS = Object.keys(TIPO_TREINO_LABELS) as Array<keyof typeof TIPO_TREINO_LABELS>;

function estimarTss(duracaoMinutos: number, rpe: number): number {
    return Math.round((duracaoMinutos / 60) * Math.pow(rpe / 10, 2) * 100);
}

export interface ManualTrainingFormProps {
    loading: boolean;
    hasTreinoHoje: boolean;
    /**
     * `true` durante `TrainingPhase.CALIBRATION` (task 8.3/8.4, athlete-onboarding-baseline) —
     * mostra 4 campos extras (dor, fadiga, sono, recuperação) além do RPE. Fora da calibração,
     * só RPE é perguntado.
     */
    emCalibracao?: boolean;
    /** Pré-preenche a partir do treino planejado de hoje (modo treino, "Concluí o treino"). */
    initial?: { tipo?: string; duracaoMinutos?: number };
    onSubmit: (input: TreinoManualInput) => Promise<void>;
}

export function ManualTrainingForm({ loading, hasTreinoHoje, emCalibracao = false, initial, onSubmit }: ManualTrainingFormProps) {
    const [hoje, minData] = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const min = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        return [today, min];
    }, []);

    // O tipo vindo do modo treino é o mesmo enum do backend (TipoTreino); fora da lista, o
    // default de sempre — não trava o formulário por um valor que a UI não reconhece.
    const tipoInicial: TipoTreino = initial?.tipo && (initial.tipo in TIPO_TREINO_LABELS)
        ? (initial.tipo as TipoTreino)
        : 'CONTINUO';

    const [tipo, setTipo] = useState<TipoTreino>(tipoInicial);
    const [data, setData] = useState(hoje);
    const [duracaoMinutos, setDuracaoMinutos] = useState<number | ''>(initial?.duracaoMinutos ?? 45);
    const [distanciaKm, setDistanciaKm] = useState<number | ''>('');
    const [rpe, setRpe] = useState<number>(6);
    const [observacoes, setObservacoes] = useState('');
    const [calibracaoExtras, setCalibracaoExtras] = useState<CalibracaoExtras>(CALIBRACAO_EXTRAS_DEFAULT);

    const tssEstimado = duracaoMinutos !== '' && duracaoMinutos > 0
        ? estimarTss(duracaoMinutos, rpe)
        : 0;

    const isValid = Boolean(tipo)
        && data >= minData && data <= hoje
        && duracaoMinutos !== '' && duracaoMinutos >= 1 && duracaoMinutos <= 600
        && rpe >= 1 && rpe <= 10;

    const handleSubmit = useCallback(async () => {
        if (!isValid) return;
        const duracao = typeof duracaoMinutos === 'number' ? duracaoMinutos : 0;
        const distancia = tipo !== 'REGENERATIVO'
            && typeof distanciaKm === 'number' && distanciaKm > 0
            ? distanciaKm
            : undefined;
        await onSubmit({
            tipo,
            data,
            duracaoMinutos: duracao,
            distanciaKm: distancia,
            percepcaoEsforco: rpe,
            observacoes: observacoes.trim() || undefined,
            ...(emCalibracao && calibracaoExtras),
        });
        setTipo('CONTINUO');
        setDuracaoMinutos(45);
        setDistanciaKm('');
        setRpe(6);
        setObservacoes('');
        setData(hoje);
        setCalibracaoExtras(CALIBRACAO_EXTRAS_DEFAULT);
    }, [isValid, duracaoMinutos, distanciaKm, tipo, data, rpe, observacoes, hoje, onSubmit, emCalibracao, calibracaoExtras]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {hasTreinoHoje && (
                <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                    Você já registrou um treino hoje. Pode registrar outro se desejar.
                </Alert>
            )}

            <Box>
                <OnboardingSectionLabel>Tipo de treino</OnboardingSectionLabel>
                <Box
                    role="radiogroup"
                    aria-label="Tipo de treino"
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                >
                    {TIPOS.map((t) => (
                        <Chip
                            key={t}
                            label={TIPO_TREINO_LABELS[t]}
                            onClick={() => setTipo(t)}
                            role="radio"
                            aria-checked={tipo === t}
                            sx={{
                                bgcolor: tipo === t ? primary[500] : content.cardBg,
                                color: tipo === t ? backgrounds.canvas : surface[200],
                                fontWeight: tipo === t ? 700 : 400,
                                border: `1px solid ${tipo === t ? primary[500] : content.cardBorder}`,
                                '&:hover': {
                                    bgcolor: tipo === t ? primary[400] : content.cardBgHover,
                                },
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <OnboardingSectionLabel>Data do treino</OnboardingSectionLabel>
                <TextField
                    type="date"
                    label="Data do treino"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    fullWidth
                    inputProps={{ min: minData, max: hoje }}
                    sx={onboardingInputSx}
                />
            </Box>

            <Box>
                <OnboardingSectionLabel>Duração (minutos)</OnboardingSectionLabel>
                <TextField
                    type="number"
                    label="Duração (minutos)"
                    value={duracaoMinutos}
                    onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setDuracaoMinutos(v);
                    }}
                    fullWidth
                    inputProps={{ min: 1, max: 600 }}
                    sx={onboardingInputSx}
                />
            </Box>

            {tipo !== 'REGENERATIVO' && (
                <Box>
                    <OnboardingSectionLabel>Distância (km) — opcional</OnboardingSectionLabel>
                    <TextField
                        type="number"
                        label="Distância (km)"
                        value={distanciaKm}
                        onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setDistanciaKm(v);
                        }}
                        fullWidth
                        inputProps={{ min: 0.1, max: 200, step: 0.1 }}
                        sx={onboardingInputSx}
                    />
                </Box>
            )}

            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <OnboardingSectionLabel>Percepção de esforço (RPE)</OnboardingSectionLabel>
                    <Typography sx={{ color: primary[500], fontSize: '0.85rem', fontWeight: 700 }}>
                        {rpe}/10 — {RPE_LABELS[rpe]}
                    </Typography>
                </Box>
                <Slider
                    value={rpe}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    aria-label="Percepção de esforço (RPE)"
                    getAriaValueText={(v) => `${v}/10 — ${RPE_LABELS[v]}`}
                    onChange={(_e, v) => { if (typeof v === 'number') setRpe(v); }}
                    sx={{
                        color: primary[500],
                        '& .MuiSlider-mark': { bgcolor: surface[600] },
                        '& .MuiSlider-markActive': { bgcolor: primary[500] },
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Muito fácil</Typography>
                    <Typography sx={{ color: surface[400], fontSize: '0.75rem' }}>Máximo</Typography>
                </Box>

                {tssEstimado > 0 && (
                    <Typography sx={{ color: surface[400], fontSize: '0.8rem', mt: 1 }}>
                        ~{tssEstimado} TSS (estimativa)
                    </Typography>
                )}
            </Box>

            {emCalibracao && (
                <CalibrationExtrasFields
                    value={calibracaoExtras}
                    onChange={(patch) => setCalibracaoExtras((prev) => ({ ...prev, ...patch }))}
                />
            )}

            <Box>
                <OnboardingSectionLabel>Observações (opcional)</OnboardingSectionLabel>
                <TextField
                    multiline
                    rows={3}
                    label="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value.slice(0, 500))}
                    fullWidth
                    placeholder="Como foi o treino? Algo a registrar?"
                    helperText={`${observacoes.length}/500`}
                    sx={onboardingInputSx}
                />
            </Box>

            <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={!isValid || loading}
                fullWidth
                sx={{
                    bgcolor: primary[500],
                    color: backgrounds.canvas,
                    fontWeight: 700,
                    fontSize: '1rem',
                    py: 1.5,
                    '&:hover': { bgcolor: primary[400] },
                    '&.Mui-disabled': { bgcolor: surface[700], color: surface[500] },
                }}
            >
                {loading ? 'Registrando...' : 'Registrar treino'}
            </Button>
        </Box>
    );
}
